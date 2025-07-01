import tkinter as tk
from tkinter import filedialog, scrolledtext
from openai import OpenAI
import os
from dotenv import load_dotenv
import pyaudio
import wave
import threading
import tempfile

load_dotenv()

class TranscriptionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Audio Transcription Tool")
        self.root.geometry("600x550")  # Made a bit taller for new controls
        self.root.configure(padx=20, pady=20)
        
        self.file_path = None
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Recording variables
        self.is_recording = False
        self.audio_thread = None
        self.audio_frames = []
        self.sample_rate = 44100
        self.channels = 1
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.temp_audio_file = None
        
        # File selection
        self.frame_file = tk.Frame(root)
        self.frame_file.pack(fill=tk.X, pady=10)
        
        self.label_file = tk.Label(self.frame_file, text="Select audio file:")
        self.label_file.pack(side=tk.LEFT)
        
        self.file_path_var = tk.StringVar()
        self.entry_file = tk.Entry(self.frame_file, textvariable=self.file_path_var, width=40)
        self.entry_file.pack(side=tk.LEFT, padx=10)
        
        self.btn_browse = tk.Button(self.frame_file, text="Browse", command=self.browse_file)
        self.btn_browse.pack(side=tk.LEFT)
        
        # Microphone controls
        self.frame_mic = tk.Frame(root)
        self.frame_mic.pack(fill=tk.X, pady=10)
        
        self.label_mic = tk.Label(self.frame_mic, text="Or record from microphone:")
        self.label_mic.pack(side=tk.LEFT)
        
        self.btn_record = tk.Button(self.frame_mic, text="Start Recording", command=self.toggle_recording, bg="#FF5722", fg="white")
        self.btn_record.pack(side=tk.LEFT, padx=10)
        
        # Record status
        self.recording_status_var = tk.StringVar()
        self.recording_status_var.set("")
        self.label_recording_status = tk.Label(self.frame_mic, textvariable=self.recording_status_var, fg="red")
        self.label_recording_status.pack(side=tk.LEFT)
        
        # Transcribe button
        self.btn_transcribe = tk.Button(root, text="Transcribe", command=self.transcribe_audio, bg="#4CAF50", fg="white", height=2)
        self.btn_transcribe.pack(pady=10)
        
        # Status label
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        self.label_status = tk.Label(root, textvariable=self.status_var, fg="blue")
        self.label_status.pack(pady=5)
        
        # Output area
        self.label_output = tk.Label(root, text="Transcription:")
        self.label_output.pack(anchor=tk.W, pady=(10, 5))
        
        self.txt_output = scrolledtext.ScrolledText(root, wrap=tk.WORD, height=15)
        self.txt_output.pack(fill=tk.BOTH, expand=True)
        
        # Copy button
        self.btn_copy = tk.Button(root, text="Copy to Clipboard", command=self.copy_to_clipboard)
        self.btn_copy.pack(pady=10)
    
    def browse_file(self):
        filetypes = [
            ("Audio files", "*.mp3 *.wav *.m4a *.flac"),
            ("All files", "*.*")
        ]
        filepath = filedialog.askopenfilename(filetypes=filetypes)
        if filepath:
            self.file_path_var.set(filepath)
            self.file_path = filepath
            # Clear any recorded audio when selecting a file
            self.temp_audio_file = None
    
    def toggle_recording(self):
        if self.is_recording:
            self.stop_recording()
        else:
            self.start_recording()
    
    def start_recording(self):
        self.is_recording = True
        self.btn_record.config(text="Stop Recording", bg="#F44336")
        self.recording_status_var.set("Recording...")
        self.status_var.set("Recording from microphone")
        self.audio_frames = []
        
        # Clear file path when recording
        self.file_path = None
        self.file_path_var.set("")
        
        # Start recording in a separate thread
        self.audio_thread = threading.Thread(target=self.record_audio)
        self.audio_thread.daemon = True
        self.audio_thread.start()
    
    def record_audio(self):
        p = pyaudio.PyAudio()
        stream = p.open(format=self.format,
                        channels=self.channels,
                        rate=self.sample_rate,
                        input=True,
                        frames_per_buffer=self.chunk)
        
        while self.is_recording:
            data = stream.read(self.chunk, exception_on_overflow=False)
            self.audio_frames.append(data)
            
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        # Save recorded audio to a temporary file
        self.save_audio()
    
    def save_audio(self):
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            self.temp_audio_file = f.name
        
        # Save the recorded audio to the temporary file
        wf = wave.open(self.temp_audio_file, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(pyaudio.PyAudio().get_sample_size(self.format))
        wf.setframerate(self.sample_rate)
        wf.writeframes(b''.join(self.audio_frames))
        wf.close()
        
        self.status_var.set(f"Audio saved as temporary file")
    
    def stop_recording(self):
        self.is_recording = False
        self.btn_record.config(text="Start Recording", bg="#FF5722")
        self.recording_status_var.set("Recording stopped")
        if self.audio_thread:
            self.audio_thread.join()
    
    def transcribe_audio(self):
        # Determine which audio source to use
        audio_path = None
        
        if self.temp_audio_file and os.path.exists(self.temp_audio_file):
            # Use the recorded audio
            audio_path = self.temp_audio_file
        elif self.file_path and os.path.exists(self.file_path):
            # Use the selected file
            audio_path = self.file_path
        
        if not audio_path:
            self.status_var.set("Error: No audio to transcribe")
            return
        
        self.status_var.set("Transcribing... Please wait")
        self.root.update()
        
        try:
            with open(audio_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe",
                    file=audio_file
                )
            
            self.txt_output.delete(1.0, tk.END)
            self.txt_output.insert(tk.END, transcript.text)
            self.status_var.set("Transcription complete!")
            
        except Exception as e:
            self.status_var.set(f"Error: {str(e)}")
            self.txt_output.delete(1.0, tk.END)
            self.txt_output.insert(tk.END, f"An error occurred:\n{str(e)}")
    
    def copy_to_clipboard(self):
        text = self.txt_output.get(1.0, tk.END).strip()
        if text:
            self.root.clipboard_clear()
            self.root.clipboard_append(text)
            self.status_var.set("Copied to clipboard!")
        else:
            self.status_var.set("Nothing to copy")

if __name__ == "__main__":
    root = tk.Tk()
    app = TranscriptionApp(root)
    root.mainloop()