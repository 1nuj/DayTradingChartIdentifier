import React, { useState, ChangeEvent } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // optional base64 image
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    const newMessage: Message = { role: 'user', content: input, image: image || undefined };
    setMessages((prev: Message[]) => [...prev, newMessage]);
    setInput('');
    setImage(null);

    let replyText = 'Thinking...';

    if (image) {
      const base64Image = image.split(',')[1];

      const res = await fetch(
        'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              prompt: input || 'Describe this image',
              image: base64Image,
            },
          }),
        }
      );

      const data = await res.json();
      console.log('Hugging Face API response:', data);
      replyText = data.generated_text || JSON.stringify(data) || 'No response from model.';
    } else {
      replyText = 'Text-only input detected. Try uploading an image!';
    }

    const assistantReply: Message = {
      role: 'assistant',
      content: replyText,
    };

    setMessages((prev: Message[]) => [...prev, assistantReply]);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div
        style={{
          height: 300,
          overflowY: 'scroll',
          border: '1px solid #ccc',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === 'user' ? 'right' : 'left',
              marginBottom: '1rem',
            }}
          >
            <strong>{msg.role}:</strong> {msg.content}
            {msg.image && (
              <div>
                <img
                  src={msg.image}
                  alt="uploaded"
                  style={{ maxWidth: '200px', marginTop: '0.5rem' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          style={{ flex: 1, padding: '0.5rem' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={handleSend} style={{ padding: '0.5rem 1rem' }}>
          Send
        </button>
      </div>

      {image && (
        <div>
          <strong>Preview:</strong>
          <br />
          <img src={image} alt="preview" style={{ maxWidth: '200px' }} />
        </div>
      )}
    </div>
  );
}
