'use client'

import { useState, useEffect } from 'react'

// Scrambles letters into `targetText` whenever it changes: the jaiyank ↔
// siphyshu swap on hover, in the homepage hero and the compact header.
const TextMorph = ({ targetText, isAnimating }) => {
    const [scrambledText, setScrambledText] = useState(targetText);
    const characters = 'abcdefghijklmnopqrstuvwxyz';

    useEffect(() => {
        if (!isAnimating) {
            return;
        }

        // A trailing emoji ("jaiyank! 👋") is held still while the words
        // scramble. Plain text ("jaiyank", in the compact header) has none, so
        // all of it scrambles.
        const words = targetText.split(' ');
        const hasEmoji = words.length > 1 && !/[a-z]/i.test(words[words.length - 1]);
        const textPart = hasEmoji ? words.slice(0, -1).join(' ') : targetText;
        const emojiPart = hasEmoji ? words[words.length - 1] : '';

        let steps = 0;
        const maxSteps = 10; // Increased for smoother transition
        
        // Smoother easing function with more pronounced curve
        const easeInOut = (t) => {
            if ( t <= 0.5 ) {
                return 2.0 * t * t;
            }

            t -= 0.5;
            return 1 - Math.pow(1 - t, 100);
        }
    

        const interval = setInterval(() => {
            if (steps >= maxSteps) {
                setScrambledText(targetText);
                clearInterval(interval);
                return;
            }

            const progress = easeInOut(steps / maxSteps);

            const scrambled = textPart
                .split('')
                .map((char, index) => {
                    if (char === ' ' || char === ',' || char === '!' || char === "'") return char;
                    
                    // More gradual character reveal
                    if (Math.random() < progress * 1.5) return textPart[index];
                    
                    // Use character set closer to the final character for smoother transition
                    const randomChar = Math.random() < progress 
                        ? characters[Math.floor(Math.random() * 5) + characters.indexOf(textPart[index].toLowerCase()) - 2]
                        : characters[Math.floor(Math.random() * characters.length)];
                    return randomChar || textPart[index];
                })
                .join('');

            setScrambledText(emojiPart ? `${scrambled} ${emojiPart}` : scrambled);
            steps++;
        }, 70); // Adjusted timing for smoother animation

        return () => clearInterval(interval);
    }, [targetText, isAnimating]);

    return isAnimating ? scrambledText : targetText;
};

export default TextMorph;
