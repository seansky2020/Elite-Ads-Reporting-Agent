
import React, { useState, useCallback } from 'react';
import { generateReport } from './services/geminiService';
import { ReportData, ChatMessage } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { HeaderIcon } from './components/Icons';
import { Chat } from '@google/genai';

const App: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleFileUpload = useCallback(async (csvData: string, name: string) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setFileName(name);
    setChat(null);
    setChatHistory([]);
    try {
      const { report: generatedReport, chat: generatedChat } = await generateReport(csvData);
      setReport(generatedReport);
      setChat(generatedChat);
      setChatHistory([{
        role: 'model',
        text: "Hello! I've analyzed your ads performance. Feel free to ask me any questions about the data or the generated report."
      }]);
    } catch (err) {
      console.error(err);
      setError('Failed to generate report. Please ensure the CSV format is correct and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setReport(null);
    setError(null);
    setFileName(null);
    setIsLoading(false);
    setChat(null);
    setChatHistory([]);
    setIsChatLoading(false);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chat || isChatLoading || !message.trim()) return;

    setIsChatLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    
    // Add a placeholder for the model's response to enable streaming UI
    setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

    try {
        const stream = await chat.sendMessageStream({ message });
        let fullResponse = "";
        for await (const chunk of stream) {
            fullResponse += chunk.text;
            setChatHistory(prev => {
                const newHistory = [...prev];
                // Update the last message (the model's response) in-place
                if(newHistory.length > 0) {
                  newHistory[newHistory.length - 1].text = fullResponse;
                }
                return newHistory;
            });
        }
    } catch (err) {
        console.error(err);
        setChatHistory(prev => {
            const newHistory = [...prev];
             if(newHistory.length > 0) {
               newHistory[newHistory.length - 1].text = "Sorry, I encountered an error. Please try again.";
             }
            return newHistory;
        });
    } finally {
        setIsChatLoading(false);
    }
  }, [chat, isChatLoading]);


  return (
    <div className="min-h-screen bg-slate-100/50 text-slate-800 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HeaderIcon />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Elite Ads Reporting Agent
            </h1>
          </div>
           {report && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Analyze New Report
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!report && (
          <div className="max-w-3xl mx-auto">
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mt-6 p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg">
            <p className="font-semibold">An error occurred:</p>
            <p>{error}</p>
          </div>
        )}

        {report && fileName && (
          <Dashboard 
            report={report} 
            fileName={fileName} 
            chatHistory={chatHistory}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
          />
        )}
      </main>
    </div>
  );
};

export default App;
