import { useEffect, useRef } from "react";
import Message from "./Message";

export default function MessagesList({ messages }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((m) => (
        <Message key={m.id} sender={m.sender} text={m.text} time={m.time} />
      ))}

      <div ref={bottomRef}></div>
    </div>
  );
}
