
import { useState, useEffect, useMemo } from 'react';

const SELF_HARM_KEYWORDS = ["kill myself", "suicide", "want to die", "self harm", "self-harm", "ending my life", "end my life"];
const LISTENING_KEYWORDS = ["i feel lonely", "i feel so alone", "i need someone to listen", "i just need to vent", "i need to talk", "no one understands"];
const EMPATHIC_MESSAGES = [
    "I hear you. This space is here for you.",
    "That sounds heavy. You’re not alone right now.",
    "Take your time. I'm here to listen.",
];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const useListeningMode = (text: string) => {
    const [isListening, setIsListening] = useState(false);
    const [isSafetyTriggered, setIsSafetyTriggered] = useState(false);

    const empathicMessage = useMemo(() => {
        return getRandomItem(EMPATHIC_MESSAGES);
    }, []);

    const reset = () => {
        setIsListening(false);
        setIsSafetyTriggered(false);
    };

    useEffect(() => {
        const lowercasedText = text.toLowerCase();

        // Safety check is sticky. Once triggered, it stays on until reset.
        if (!isSafetyTriggered) {
            const safetyCheck = SELF_HARM_KEYWORDS.some(keyword => lowercasedText.includes(keyword));
            if (safetyCheck) {
                setIsSafetyTriggered(true);
                setIsListening(false); // Safety overrides listening
                return; // Stop further processing
            }
        } else {
            // if safety is triggered, we don't need to check for listening mode.
            return;
        }

        // Listening check is dynamic. It reflects the current text.
        const listeningCheck = LISTENING_KEYWORDS.some(keyword => lowercasedText.includes(keyword));
        setIsListening(listeningCheck);

    }, [text, isSafetyTriggered]);

    return { isListening, isSafetyTriggered, empathicMessage, reset };
};
