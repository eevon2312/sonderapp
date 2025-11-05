

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audio';

// Conditionally initialize the client only if the API key exists.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

interface UseLiveConversationProps {
  onTurnComplete: (userInput: string, modelOutput: string) => void;
  onModelTranscript: (text: string, isFinal: boolean) => void;
  onUserTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
}

export const useLiveConversation = (props: UseLiveConversationProps) => {
  const [isActive, setIsActive] = useState(false);
  
  const callbacksRef = useRef(props);
  useEffect(() => {
    callbacksRef.current = props;
  }, [props]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopConversation = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    
    nextStartTimeRef.current = 0;
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    setIsActive(false);
  }, []);

  const startConversation = useCallback(async () => {
    if (isActive) return;

    if (!ai) {
      callbacksRef.current.onError('Voice interaction is unavailable: API Key is not configured.');
      console.error("GoogleGenAI client not initialized. Check API_KEY.");
      return;
    }

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsActive(true);

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
            mediaStreamSourceRef.current = source;

            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            try {
              if (message.serverContent?.inputTranscription) {
                  const text = message.serverContent.inputTranscription.text;
                  currentInputTranscriptionRef.current += text;
                  callbacksRef.current.onUserTranscript(currentInputTranscriptionRef.current, false);
              }
              if (message.serverContent?.outputTranscription) {
                  const text = message.serverContent.outputTranscription.text;
                  currentOutputTranscriptionRef.current += text;
                  callbacksRef.current.onModelTranscript(currentOutputTranscriptionRef.current, false);
              }

              if (message.serverContent?.turnComplete) {
                  callbacksRef.current.onUserTranscript(currentInputTranscriptionRef.current, true);
                  callbacksRef.current.onModelTranscript(currentOutputTranscriptionRef.current, true);
                  callbacksRef.current.onTurnComplete(currentInputTranscriptionRef.current, currentOutputTranscriptionRef.current);
                  currentInputTranscriptionRef.current = '';
                  currentOutputTranscriptionRef.current = '';
              }

              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') return;
                const outputCtx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            } catch (err) {
              console.error("Error processing live message:", err);
              callbacksRef.current.onError('An error occurred during the conversation.');
              stopConversation();
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live conversation error:', e);
            callbacksRef.current.onError('A network error occurred. Please check your connection or API key.');
            stopConversation();
          },
          onclose: () => {
            stopConversation();
          },
        },
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start conversation', err);
      callbacksRef.current.onError('Could not access microphone. Please check permissions.');
      stopConversation();
    }
  }, [isActive, stopConversation]);

  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return { isActive, startConversation, stopConversation };
};
