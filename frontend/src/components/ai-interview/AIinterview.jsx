import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import axios from 'axios';
import Navbar from '../Navbar';

const AIInterview = () => {
    const { projectId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [projectDetails, setProjectDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [interviewFinished, setInterviewFinished] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);
    
    const recognitionRef = useRef(null);
    // Reference for media recorder
    const mediaRecorderRef = useRef(null);
    // Reference for auto-scrolling chat
    const messagesEndRef = useRef(null);
    
    // Fetch project details on component mount
    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3000/freelancer/projects/${projectId}`);
                setProjectDetails(response.data);
                
                // Change the system prompt based on project type
                let initialSystemPrompt = '';
                if (response.data.projectType === 'content') {
                    initialSystemPrompt = `You are conducting a technical interview for a content writing position. 
The project involves ${response.data.description}. 
Topics include: ${response.data.technologies.join(', ')}. 
The skill level required is ${response.data.level}.
Ask questions that assess the candidate's content writing skills, understanding of SEO, content strategy, audience targeting, and writing style. 
Be thorough and evaluate their expertise in content creation.`;
                } else {
                    initialSystemPrompt = `You are conducting a technical interview for a software development position. 
The project involves ${response.data.description}. 
Technologies include: ${response.data.technologies.join(', ')}. 
The skill level required is ${response.data.level}.
Ask questions that assess the candidate's technical knowledge and problem-solving skills. 
Be thorough and evaluate their expertise with the required technologies.`;
                }
                
                // Set initial system message
                setMessages([{
                    role: 'system',
                    content: initialSystemPrompt
                }]);
                
                setLoading(false);
                
                // Start the interview automatically after loading project details
                startInterview(response.data);
            } catch (error) {
                console.error('Error fetching project details:', error);
                setError('Failed to load project details');
                setLoading(false);
            }
        };
        
        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId]);
    
    // Auto-scroll to bottom of chat when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Clean up recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);
    
    const startInterview = async (projectData) => {
        try {
            // Set bot typing indicator
            setIsBotTyping(true);
            
            // Send initial message to /ask-question endpoint
            const response = await axios.post('http://localhost:8008/ask-question', {
                query: `Hi, my name is ${currentUser?.displayName || currentUser?.email || 'a candidate'}. I'm here for the interview.`,
                project_id: projectId,
                developer_email: currentUser?.email,
                project_name: projectData.projectName,
                project_description: projectData.description,
                technologies: projectData.technologies.join(', '),
                project_duration: projectData.duration || "Not specified"
            });
            
            setIsBotTyping(false);
            
            // Add AI response to messages
            if (response.data.success) {
                setMessages([{
                    sender: 'ai',
                    text: response.data.answer || `Hello ${currentUser?.displayName || 'there'}! Welcome to your technical interview for "${projectData.projectName}". Let's discuss your experience with ${projectData.technologies.join(', ')}.`,
                    timestamp: new Date()
                }]);
            } else {
                // Fallback greeting if API call fails
                setMessages([{
                    sender: 'ai',
                    text: `Hello ${currentUser?.displayName || 'there'}! Welcome to your technical interview for "${projectData.projectName}". I'll be asking you some questions about ${projectData.technologies.join(', ')}. Let's start with a simple introduction. Could you tell me about your experience with these technologies?`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error("Error starting interview:", error);
            setIsBotTyping(false);
            
            // Fallback greeting if API call fails
            setMessages([{
                sender: 'ai',
                text: `Hello ${currentUser?.displayName || 'there'}! Welcome to your technical interview for "${projectData.projectName}". I'll be asking you some questions about ${projectData.technologies.join(', ')}. Let's start with a simple introduction. Could you tell me about your experience with these technologies?`,
                timestamp: new Date()
            }]);
        }
    };
    
    const handleSendMessage = async () => {
        if (!userInput.trim()) return;
        
        const userMessage = {
            sender: 'user',
            text: userInput,
            timestamp: new Date()
        };
        
        // Add user message to chat
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        
        // Show bot is typing
        setIsBotTyping(true);
        
        try {
            // Use the ask-question endpoint
            const response = await axios.post('http://localhost:8008/ask-question', {
                query: userInput,
                project_id: projectId,
                developer_email: currentUser.email,
                interviewer_email: projectDetails.employerEmail || "employer@example.com",
                project_name: projectDetails.projectName, 
                project_description: projectDetails.description,
                technologies: projectDetails.technologies.join(', '),
                project_duration: projectDetails.duration || "Not specified"
            });
            
            // Simulate delay for more natural conversation
            setTimeout(() => {
                setIsBotTyping(false);
                
                const aiResponse = {
                    sender: 'ai',
                    text: response.data.answer || "I'm processing your response. Let me ask another question...",
                    timestamp: new Date()
                };
                
                setMessages(prev => [...prev, aiResponse]);
                
                // Check if interview should end based on is_interview_over flag
                if (response.data.is_interview_over === true) {
                    setInterviewFinished(true);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            setIsBotTyping(false);
            
            // Add error message
            setMessages(prev => [...prev, {
                sender: 'ai',
                text: "I'm sorry, I encountered an error processing your response. Let's continue with another question.",
                timestamp: new Date()
            }]);
        }
    };
    
    
    const toggleVoiceRecording = async () => {
        if (isRecording) {
            // Stop recording
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            return;
        }
        
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Determine supported MIME type
            const mimeType = getSupportedMimeType();
            
            // Set up media recorder with selected mime type
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks = [];
            
            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener("stop", async () => {
                setIsRecording(false);
                
                // Use the file extension that matches the MIME type
                const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
                
                // Create audio blob from recorded chunks
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                
                // Create form data to send to API
                const formData = new FormData();
                formData.append('file', audioBlob, `recording.${fileExtension}`);
                formData.append('mimeType', mimeType); // Send MIME type to help the server
                
                try {
                    setUserInput("Processing your speech...");
                    
                    // Send to transcription API
                    const response = await axios.post('http://localhost:8008/transcribe-audio', 
                        formData, 
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                    
                    // Update text input with transcription
                    setUserInput(response.data.transcription);
                    
                } catch (error) {
                    console.error("Transcription error:", error);
                    setUserInput(prevInput => 
                        prevInput === "Processing your speech..." ? 
                        "Error transcribing audio. Please try again." : 
                        prevInput
                    );
                } finally {
                    // Stop all audio tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            });
            
            // Start recording
            mediaRecorder.start();
            setIsRecording(true);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert("Could not access microphone. Please check your microphone permissions.");
        }
    };
    
    const getSupportedMimeType = () => {
        const possibleTypes = [
            'audio/mp4',
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];
        
        for (const type of possibleTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        // Default fallback
        return '';
    }
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const finishInterview = () => {
        navigate(`/profile`);
    };
    
    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="container mx-auto flex-grow p-4 flex flex-col max-w-4xl">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        AI Interview: {projectDetails?.projectName}
                    </h1>
                    <p className="text-gray-600">
                        Technical interview for {projectDetails?.technologies?.join(', ')}
                    </p>
                </div>
                
                {/* Chat area */}
                <div className="bg-white shadow rounded-lg p-4 flex-grow mb-4 overflow-y-auto max-h-[calc(100vh-320px)]">
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                        message.sender === 'user' 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    <p className="whitespace-pre-line">{message.text}</p>
                                    <p className={`text-xs mt-1 ${
                                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                        {message.timestamp && message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        
                        {isBotTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Auto-scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                
                {/* Input area */}
                {!interviewFinished ? (
                    <div className="bg-white shadow rounded-lg p-4">
                        <div className="flex items-end space-x-2">
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type your answer..."
                                className="flex-grow border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                disabled={isRecording}
                            />
                            
                            <button
                                onClick={toggleVoiceRecording}
                                className={`px-4 py-3 rounded-full ${
                                    isRecording 
                                        ? 'bg-red-500 hover:bg-red-600' 
                                        : 'bg-blue-100 hover:bg-blue-200'
                                }`}
                                title={isRecording ? "Stop recording" : "Start voice recording"}
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" 
                                    className={`h-5 w-5 ${isRecording ? 'text-white' : 'text-blue-500'}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={handleSendMessage}
                                disabled={!userInput.trim()}
                                className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <h3 className="text-xl font-semibold text-green-600 mb-3">Interview Completed!</h3>
                        <p className="mb-4">Thank you for completing this technical interview. Your responses have been recorded and the Project Manager will get back to you soon.</p>
                        <button 
                            onClick={finishInterview}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg"
                            type="button"
                        >
                            Return to Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIInterview;