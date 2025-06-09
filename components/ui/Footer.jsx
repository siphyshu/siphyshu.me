"use client"

import { useState, useEffect, useRef } from 'react'

export default function Footer() {
    const [isBlinking, setIsBlinking] = useState(false)
    const [isAwake, setIsAwake] = useState(false)
    const [zPositions, setZPositions] = useState([])
    const catRef = useRef(null)
    const zInterval = useRef(null)
    const sleepTimeout = useRef(null)
    const audioRef = useRef(null)
    const lastMeowTime = useRef(0)
    const MEOW_COOLDOWN = 1000 // 1 second cooldown

    const playRandomMeow = () => {
        const now = Date.now()
        if (now - lastMeowTime.current < MEOW_COOLDOWN) {
            return // Ignore click if cooldown hasn't passed
        }
        
        lastMeowTime.current = now
        const meowNumber = Math.floor(Math.random() * 2) + 1
        const audio = new Audio(`/meow${meowNumber}.wav`)
        audio.play()
    }

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!catRef.current) return
            
            const rect = catRef.current.getBoundingClientRect()
            const distance = Math.hypot(
                e.clientX - (rect.left + rect.width/2),
                e.clientY - (rect.top + rect.height/2)
            )
            
            if (distance < 100) {
                setIsAwake(true)
                // Clear any pending sleep timeout
                if (sleepTimeout.current) {
                    clearTimeout(sleepTimeout.current)
                    sleepTimeout.current = null
                }
            } else if (!sleepTimeout.current) {
                // Set timeout to go back to sleep
                sleepTimeout.current = setTimeout(() => {
                    setIsAwake(false)
                    sleepTimeout.current = null
                }, 5000)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            if (sleepTimeout.current) {
                clearTimeout(sleepTimeout.current)
            }
        }
    }, [])

    useEffect(() => {
        if (!isAwake) {
            // Start continuous Z animation when sleeping
            zInterval.current = setInterval(() => {
                setZPositions(prev => {
                    // Add new Z
                    const newZ = { id: Date.now(), offset: Math.random() * 7 + 1 }
                    // Keep only last 4 Z's
                    return [...prev, newZ].slice(-4)
                })
            }, 800)
        } else {
            // Clear Z animation when awake
            if (zInterval.current) {
                clearInterval(zInterval.current)
            }
            setZPositions([])
        }

        return () => {
            if (zInterval.current) {
                clearInterval(zInterval.current)
            }
        }
    }, [isAwake])

    useEffect(() => {
        const blink = () => {
            if (!isAwake) return
            setIsBlinking(true)
            setTimeout(() => {
                setIsBlinking(false)
                setTimeout(blink, Math.random() * 2000 + 6000)
            }, 150)
        }

        if (isAwake) {
            blink()
        }
    }, [isAwake])

    return (
        <footer className="flex flex-col w-full py-8">
            <div className="relative mt-8 flex justify-end">
                <div 
                    ref={catRef} 
                    className="relative inline-block cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={playRandomMeow}
                >
                    <pre className="font-mono leading-[0.9] tracking-tighter text-gray-300 text-xs text-right">  
{' '}{' '}^~^  ,<br/>
{' '}({isAwake ? (isBlinking ? '-Y-' : '\'Y\'') : 'ᵕ.ᵕ'}) )<br/>
{' '}/   \/{' '}<br/> 
(\|||/){' '}
</pre>
                    {zPositions.map((z, index) => (
                        <div 
                            key={z.id}
                            className="absolute -top-4 -right-2 animate-float-z text-gray-300 text-xs font-mono"
                            style={{ 
                                right: `${z.offset}px`,
                            }}
                        >
                            z
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full border-t border-gray-300 border-1 mb-8"></div>

            {/* <div className="flex justify-center text-gray-500 text-sm">
                <p>💻❤️🌏</p>
            </div> */}
        </footer>
    )
}