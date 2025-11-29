export default function Message({ sender, text, time }) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[70%] p-3 rounded-xl text-sm ${
          isUser
            ? "bg-green-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-900 rounded-bl-none"
        }`}
      >
        <p>{text}</p>
        <p className="text-[10px] mt-1 opacity-80">{time}</p>
      </div>
    </div>
  );
}
