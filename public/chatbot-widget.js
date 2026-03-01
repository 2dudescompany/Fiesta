// /**
//  * HAVY Chatbot Widget - Embeddable Script
//  * This script can be embedded on any website to add the chatbot widget
//  */

// (function() {
//   'use strict';

//   // Wait for config to be available
//   if (!window.HAVYChatbotConfig) {
//     console.error('HAVYChatbotConfig is not defined. Please configure the chatbot before loading this script.');
//     return;
//   }

//   const config = window.HAVYChatbotConfig;
//   const rasaServerUrl = config.rasaServerUrl || 'http://localhost:5005';
//   const userId = config.userId || 'user';
//   const position = config.position || 'bottom-right';
//   const primaryColor = config.primaryColor || '#3B82F6';

//   // Create widget container
//   const widgetContainer = document.createElement('div');
//   widgetContainer.id = 'havy-chatbot-widget';
//   document.body.appendChild(widgetContainer);

//   // Inject styles
//   const style = document.createElement('style');
//   style.textContent = `
//     #havy-chatbot-widget {
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//     }
//     #havy-chatbot-widget * {
//       box-sizing: border-box;
//     }
//     .havy-chatbot-button {
//       position: fixed;
//       width: 56px;
//       height: 56px;
//       border-radius: 50%;
//       border: none;
//       cursor: pointer;
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       z-index: 9999;
//       transition: transform 0.2s;
//     }
//     .havy-chatbot-button:hover {
//       transform: scale(1.1);
//     }
//     .havy-chatbot-window {
//       position: fixed;
//       width: 384px;
//       height: 600px;
//       background: white;
//       border-radius: 8px;
//       box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
//       display: flex;
//       flex-direction: column;
//       z-index: 9999;
//       transition: height 0.3s;
//     }
//     .havy-chatbot-window.minimized {
//       height: 64px;
//     }
//     .havy-chatbot-header {
//       padding: 16px;
//       border-radius: 8px 8px 0 0;
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       color: white;
//     }
//     .havy-chatbot-header-left {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//     }
//     .havy-chatbot-status {
//       width: 8px;
//       height: 8px;
//       background: #10b981;
//       border-radius: 50%;
//     }
//     .havy-chatbot-title {
//       font-weight: 600;
//     }
//     .havy-chatbot-header-right {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//     }
//     .havy-chatbot-header-button {
//       padding: 4px;
//       background: transparent;
//       border: none;
//       color: white;
//       cursor: pointer;
//       border-radius: 4px;
//       transition: background 0.2s;
//     }
//     .havy-chatbot-header-button:hover {
//       background: rgba(255, 255, 255, 0.2);
//     }
//     .havy-chatbot-messages {
//       flex: 1;
//       overflow-y: auto;
//       padding: 16px;
//       background: #f9fafb;
//     }
//     .havy-chatbot-message {
//       display: flex;
//       margin-bottom: 16px;
//     }
//     .havy-chatbot-message.user {
//       justify-content: flex-end;
//     }
//     .havy-chatbot-message.bot {
//       justify-content: flex-start;
//     }
//     .havy-chatbot-message-bubble {
//       max-width: 80%;
//       padding: 12px 16px;
//       border-radius: 8px;
//       font-size: 14px;
//     }
//     .havy-chatbot-message.user .havy-chatbot-message-bubble {
//       background: #2563eb;
//       color: white;
//     }
//     .havy-chatbot-message.bot .havy-chatbot-message-bubble {
//       background: white;
//       color: #1f2937;
//       border: 1px solid #e5e7eb;
//     }
//     .havy-chatbot-message-time {
//       font-size: 11px;
//       opacity: 0.7;
//       margin-top: 4px;
//     }
//     .havy-chatbot-loading {
//       display: flex;
//       gap: 4px;
//       padding: 12px 16px;
//       background: white;
//       border: 1px solid #e5e7eb;
//       border-radius: 8px;
//       max-width: 80px;
//     }
//     .havy-chatbot-loading-dot {
//       width: 8px;
//       height: 8px;
//       background: #9ca3af;
//       border-radius: 50%;
//       animation: bounce 1.4s infinite;
//     }
//     .havy-chatbot-loading-dot:nth-child(2) {
//       animation-delay: 0.1s;
//     }
//     .havy-chatbot-loading-dot:nth-child(3) {
//       animation-delay: 0.2s;
//     }
//     @keyframes bounce {
//       0%, 80%, 100% { transform: translateY(0); }
//       40% { transform: translateY(-8px); }
//     }
//     .havy-chatbot-input-container {
//       padding: 16px;
//       border-top: 1px solid #e5e7eb;
//       background: white;
//       border-radius: 0 0 8px 8px;
//     }
//     .havy-chatbot-input-form {
//       display: flex;
//       gap: 8px;
//     }
//     .havy-chatbot-input {
//       flex: 1;
//       padding: 12px 16px;
//       border: 1px solid #d1d5db;
//       border-radius: 8px;
//       font-size: 14px;
//       outline: none;
//     }
//     .havy-chatbot-input:focus {
//       border-color: #2563eb;
//       box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
//     }
//     .havy-chatbot-send-button {
//       padding: 12px;
//       border: none;
//       border-radius: 8px;
//       cursor: pointer;
//       color: white;
//       transition: opacity 0.2s;
//     }
//     .havy-chatbot-send-button:disabled {
//       opacity: 0.5;
//       cursor: not-allowed;
//     }
//     .havy-chatbot-position-bottom-right {
//       bottom: 16px;
//       right: 16px;
//     }
//     .havy-chatbot-position-bottom-left {
//       bottom: 16px;
//       left: 16px;
//     }
//   `;
//   document.head.appendChild(style);

//   // Widget state
//   let isOpen = false;
//   let isMinimized = false;
//   let messages = [
//     {
//       id: '1',
//       text: 'Hello! How can I help you today?',
//       sender: 'bot',
//       timestamp: new Date()
//     }
//   ];
//   let isLoading = false;

//   // Create button
//   function createButton() {
//     const button = document.createElement('button');
//     button.className = 'havy-chatbot-button havy-chatbot-position-' + position;
//     button.style.backgroundColor = primaryColor;
//     button.innerHTML = `
//       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
//       </svg>
//     `;
//     button.setAttribute('aria-label', 'Open chatbot');
//     button.onclick = () => {
//       isOpen = true;
//       render();
//     };
//     widgetContainer.appendChild(button);
//   }

//   // Create window
//   function createWindow() {
//     const window = document.createElement('div');
//     window.className = 'havy-chatbot-window havy-chatbot-position-' + position;
//     if (isMinimized) {
//       window.classList.add('minimized');
//     }
    
//     window.innerHTML = `
//       <div class="havy-chatbot-header" style="background-color: ${primaryColor}">
//         <div class="havy-chatbot-header-left">
//           <div class="havy-chatbot-status"></div>
//           <span class="havy-chatbot-title">Chat Support</span>
//         </div>
//         <div class="havy-chatbot-header-right">
//           <button class="havy-chatbot-header-button" id="havy-minimize-btn" aria-label="${isMinimized ? 'Maximize' : 'Minimize'}">
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//               ${isMinimized ? '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>' : '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>'}
//             </svg>
//           </button>
//           <button class="havy-chatbot-header-button" id="havy-close-btn" aria-label="Close">
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//               <line x1="18" y1="6" x2="6" y2="18"></line>
//               <line x1="6" y1="6" x2="18" y2="18"></line>
//             </svg>
//           </button>
//         </div>
//       </div>
//       ${!isMinimized ? `
//         <div class="havy-chatbot-messages" id="havy-messages">
//           ${renderMessages()}
//         </div>
//         <div class="havy-chatbot-input-container">
//           <form class="havy-chatbot-input-form" id="havy-input-form">
//             <input type="text" class="havy-chatbot-input" id="havy-input" placeholder="Type your message..." ${isLoading ? 'disabled' : ''}>
//             <button type="submit" class="havy-chatbot-send-button" style="background-color: ${primaryColor}" ${isLoading ? 'disabled' : ''} aria-label="Send">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                 <line x1="22" y1="2" x2="11" y2="13"></line>
//                 <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
//               </svg>
//             </button>
//           </form>
//         </div>
//       ` : ''}
//     `;
    
//     widgetContainer.appendChild(window);

//     // Attach event listeners
//     document.getElementById('havy-close-btn').onclick = () => {
//       isOpen = false;
//       render();
//     };
    
//     document.getElementById('havy-minimize-btn').onclick = () => {
//       isMinimized = !isMinimized;
//       render();
//     };

//     if (!isMinimized) {
//       const form = document.getElementById('havy-input-form');
//       const input = document.getElementById('havy-input');
      
//       form.onsubmit = (e) => {
//         e.preventDefault();
//         const text = input.value.trim();
//         if (text && !isLoading) {
//           sendMessage(text);
//           input.value = '';
//         }
//       };

//       // Auto-focus input
//       input.focus();
      
//       // Scroll to bottom
//       const messagesEl = document.getElementById('havy-messages');
//       messagesEl.scrollTop = messagesEl.scrollHeight;
//     }
//   }

//   function renderMessages() {
//     return messages.map(msg => `
//       <div class="havy-chatbot-message ${msg.sender}">
//         <div class="havy-chatbot-message-bubble">
//           <div>${escapeHtml(msg.text)}</div>
//           <div class="havy-chatbot-message-time">
//             ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//           </div>
//         </div>
//       </div>
//     `).join('') + (isLoading ? `
//       <div class="havy-chatbot-message bot">
//         <div class="havy-chatbot-loading">
//           <div class="havy-chatbot-loading-dot"></div>
//           <div class="havy-chatbot-loading-dot"></div>
//           <div class="havy-chatbot-loading-dot"></div>
//         </div>
//       </div>
//     ` : '');
//   }

//   function escapeHtml(text) {
//     const div = document.createElement('div');
//     div.textContent = text;
//     return div.innerHTML;
//   }

//   async function sendMessage(text) {
//     const userMessage = {
//       id: Date.now().toString(),
//       text: text,
//       sender: 'user',
//       timestamp: new Date()
//     };
    
//     messages.push(userMessage);
//     isLoading = true;
//     render();

//     try {
//       const response = await fetch(rasaServerUrl + '/webhooks/rest/webhook', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           message: text,
//           sender: userId,
//         }),
//       });

//       const data = await response.json();

//       if (data && data.length > 0) {
//         messages.push({
//           id: (Date.now() + 1).toString(),
//           text: data[0].text || 'I apologize, but I could not process that request.',
//           sender: 'bot',
//           timestamp: new Date()
//         });
//       } else {
//         messages.push({
//           id: (Date.now() + 1).toString(),
//           text: 'I apologize, but I could not process that request. Please try again.',
//           sender: 'bot',
//           timestamp: new Date()
//         });
//       }
//     } catch (error) {
//       console.error('Error sending message to Rasa:', error);
//       messages.push({
//         id: (Date.now() + 1).toString(),
//         text: 'Sorry, I encountered an error. Please check your Rasa server connection.',
//         sender: 'bot',
//         timestamp: new Date()
//       });
//     } finally {
//       isLoading = false;
//       render();
//     }
//   }

//   function render() {
//     widgetContainer.innerHTML = '';
//     if (isOpen) {
//       createWindow();
//     } else {
//       createButton();
//     }
//   }

//   // Initialize
//   createButton();
// })();

/**
 * HAVY Chatbot Widget - Embeddable Script
 * FAQ-only version (no Rasa)
 */

(function () {
  "use strict";

  if (!window.HAVYChatbotConfig) {
    console.error(
      "HAVYChatbotConfig is not defined. Configure chatbot before loading script."
    );
    return;
  }

  const config = window.HAVYChatbotConfig;
  const chatbotKey = config.chatbotKey;
  const position = config.position || "bottom-right";
  const primaryColor = config.primaryColor || "#3B82F6";

  const FAQ_API =
    "https://knactizuxbxjrwiduedv.supabase.co/functions/v1/faq";

  const widgetContainer = document.createElement("div");
  widgetContainer.id = "havy-chatbot-widget";
  document.body.appendChild(widgetContainer);

  /* ---------- Styles ---------- */
  const style = document.createElement("style");
  style.textContent = `
    #havy-chatbot-widget { font-family: Arial, sans-serif; }
    #havy-chatbot-widget * { box-sizing: border-box; }

    .havy-chatbot-button {
      position: fixed;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .havy-chatbot-window {
      position: fixed;
      width: 384px;
      height: 600px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      z-index: 9999;
    }

    .havy-chatbot-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      color: white;
    }

    .havy-chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }

    .havy-chatbot-message {
      display: flex;
      margin-bottom: 12px;
    }

    .havy-chatbot-message.user {
      justify-content: flex-end;
    }

    .havy-chatbot-message-bubble {
      max-width: 80%;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }

    .havy-chatbot-message.user .havy-chatbot-message-bubble {
      background: #2563eb;
      color: white;
    }

    .havy-chatbot-message.bot .havy-chatbot-message-bubble {
      background: white;
      border: 1px solid #ddd;
    }

    .havy-chatbot-input-container {
      padding: 12px;
      border-top: 1px solid #ddd;
      background: white;
    }

    .havy-chatbot-input-form {
      display: flex;
      gap: 8px;
    }

    .havy-chatbot-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
    }

    .havy-chatbot-send-button {
      padding: 10px;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
    }

    .havy-chatbot-position-bottom-right {
      bottom: 16px;
      right: 16px;
    }
  `;
  document.head.appendChild(style);

  /* ---------- State ---------- */
  let isOpen = false;
  let messages = [
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ];

  let isLoading = false;

  /* ---------- Button ---------- */
  function createButton() {
    const button = document.createElement("button");
    button.className =
      "havy-chatbot-button havy-chatbot-position-" + position;
    button.style.backgroundColor = primaryColor;
    button.innerHTML = "💬";
    button.onclick = () => {
      isOpen = true;
      render();
    };
    widgetContainer.appendChild(button);
  }

  /* ---------- Window ---------- */
  function createWindow() {
    const win = document.createElement("div");
    win.className =
      "havy-chatbot-window havy-chatbot-position-" + position;

    win.innerHTML = `
      <div class="havy-chatbot-header" style="background:${primaryColor}">
        <span>Chat Support</span>
        <button id="closeBtn">✖</button>
      </div>

      <div class="havy-chatbot-messages" id="msgs">
        ${renderMessages()}
      </div>

      <div class="havy-chatbot-input-container">
        <form id="inputForm" class="havy-chatbot-input-form">
          <input id="inputBox" class="havy-chatbot-input" placeholder="Type your message..." />
          <button class="havy-chatbot-send-button" style="background:${primaryColor}">
            ➤
          </button>
        </form>
      </div>
    `;

    widgetContainer.appendChild(win);

    document.getElementById("closeBtn").onclick = () => {
      isOpen = false;
      render();
    };

    document.getElementById("inputForm").onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById("inputBox");
      const text = input.value.trim();
      if (text && !isLoading) {
        sendMessage(text);
        input.value = "";
      }
    };
  }

  function renderMessages() {
    return messages
      .map(
        (m) => `
      <div class="havy-chatbot-message ${m.sender}">
        <div class="havy-chatbot-message-bubble">${m.text}</div>
      </div>`
      )
      .join("");
  }

  /* ---------- FAQ Call ---------- */
  async function sendMessage(text) {
    messages.push({
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    });

    isLoading = true;
    render();

    try {
      const res = await fetch(FAQ_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          chatbot_key: chatbotKey,
        }),
      });

      const data = await res.json();

      messages.push({
        id: Date.now().toString(),
        text:
          data.answer ||
          "Sorry, I don't have an answer for that.",
        sender: "bot",
        timestamp: new Date(),
      });
    } catch (err) {
      messages.push({
        id: Date.now().toString(),
        text: "Error contacting FAQ service.",
        sender: "bot",
        timestamp: new Date(),
      });
    }

    isLoading = false;
    render();
  }

  function render() {
    widgetContainer.innerHTML = "";
    if (isOpen) createWindow();
    else createButton();
  }

  createButton();
})();
