import { useState } from "react";
import Layout from "../layout/Layout";
import MessagesList from "../Coaching/MessagesList";
import { coachingMessages } from "../../data/coaching";

export default function Coaching() {
  const [messages, setMessages] = useState(coachingMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMsg]);
    setInput("");

    // Auto reply (simple mock)
    setTimeout(() => {
      const reply = {
        id: messages.length + 2,
        sender: "coach",
        text: "Got it! I'll guide you.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 700);
  };

  return (
    <Layout>
      <div className="bg-white w-full h-[calc(100vh-180px)] rounded-xl shadow-sm border flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-green-200 rounded-full"></div>
          <div>
            <p className="font-semibold">Coach Emily</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
        </div>

        {/* Messages */}
        <MessagesList messages={messages} />

        {/* Input */}
        <div className="p-4 border-t flex gap-3 bg-gray-50">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </Layout>
  );
}
