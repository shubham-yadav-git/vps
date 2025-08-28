// Chatbot functionality for Vikas Public School
class VPSChatbot {
  constructor() {
    this.apiKey = 'AIzaSyD_WPE6BDCfTcHSNJrBO6kbrWYX6aLlrvY';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.isOpen = false;
    this.conversationHistory = [];
    this.init();
  }

  init() {
    this.createChatInterface();
    this.bindEvents();
    this.setupSchoolContext();
  }

  setupSchoolContext() {
    this.schoolContext = `
You are a helpful assistant for Vikas Public School. Here's information about the school:

SCHOOL INFORMATION:
- Name: Vikas Public School
- Established: 2006
- Affiliation: CBSE
- Location: Jaunpur, UP India 222146
- Phone: +91-98765 43210
- Email: info@vikasschool.edu.in
- Office Hours: 9 AM – 4 PM, Monday to Saturday

ACADEMICS:
- Curriculum: CBSE syllabus from Nursery to Class XII
- Special Programs: STEM initiatives, Coding clubs, Language enrichment
- Assessment: Continuous Evaluation, Project Based Learning, Olympiads preparation
- Extra-Curricular: Art, Music, Dance, Debate, and Sports

LEADERSHIP:
- Manager: Jatashankar Pal
- Principal: Chandra Bhushan Yadav

FACILITIES:
- Modern Campus with Smart classrooms
- Libraries and Science labs
- Sports facilities
- Safe and inclusive environment

ADMISSIONS:
- Open for academic year 2025-26
- Process: Application → Entrance Test → Interview → Admission Confirmation
- Required Documents: Birth Certificate, Previous Year's Marksheet, Passport-size Photographs, Address Proof

MANDATORY PUBLIC DISCLOSURE:
- Available at: mandatory-public-disclosure.html
- Contains: School infrastructure details, faculty qualifications, fee structure, academic calendar, safety measures, and all regulatory compliance information as per CBSE guidelines
- Updated regularly as per government requirements
- Accessible via the green MPD badge in the website header

Please answer questions about the school in a friendly, helpful manner. If asked about mandatory disclosure, direct users to the MPD page. If asked about something not covered in this information, try to find relevant information from the current webpage content if available, otherwise politely say you don't have that specific information and suggest contacting the school directly.
`;
    
    // Get current page content
    this.getPageContent();
  }

  getPageContent() {
    try {
      // Extract text content from main sections
      const sections = ['about', 'academics', 'faculty', 'events', 'faq', 'admissions', 'contact'];
      let pageContent = '\n\nCURRENT WEBSITE CONTENT:\n';
      
      sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
          const text = section.innerText || section.textContent;
          if (text && text.trim()) {
            pageContent += `\n${sectionId.toUpperCase()}:\n${text.trim()}\n`;
          }
        }
      });
      
      this.schoolContext += pageContent;
    } catch (error) {
      console.log('Could not extract page content:', error);
    }
  }

  createChatInterface() {
    const chatHTML = `
      <div id="chatbot-container" class="chatbot-container">
        <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
            <circle cx="7" cy="9" r="1" fill="currentColor"/>
            <circle cx="12" cy="9" r="1" fill="currentColor"/>
            <circle cx="17" cy="9" r="1" fill="currentColor"/>
          </svg>
        </button>
        
        <div id="chatbot-modal" class="chatbot-modal">
          <div class="chatbot-header">
            <div class="chatbot-title">
              <h3>VPS Assistant</h3>
              <span class="chatbot-status">Online</span>
            </div>
            <button id="chatbot-close" class="chatbot-close" aria-label="Close chat">×</button>
          </div>
          
          <div id="chatbot-messages" class="chatbot-messages">
            <div class="message bot-message">
              <div class="message-content">
                <p>Hello! I'm here to help you with questions about Vikas Public School. You can ask me about:</p>
                <ul>
                  <li>Admissions process</li>
                  <li>Academic programs</li>
                  <li>School facilities</li>
                  <li>Contact information</li>
                  <li>Events and activities</li>
                </ul>
                <p>How can I assist you today?</p>
              </div>
            </div>
          </div>
          
          <div class="chatbot-input-container">
            <input 
              type="text" 
              id="chatbot-input" 
              placeholder="Type your question here..."
              maxlength="500"
            >
            <button id="chatbot-send" class="chatbot-send" aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  bindEvents() {
    const toggle = document.getElementById('chatbot-toggle');
    const close = document.getElementById('chatbot-close');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');

    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click', () => this.closeChat());
    send.addEventListener('click', () => this.sendMessage());
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      const container = document.getElementById('chatbot-container');
      if (this.isOpen && !container.contains(e.target)) {
        this.closeChat();
      }
    });
  }

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    const modal = document.getElementById('chatbot-modal');
    const toggle = document.getElementById('chatbot-toggle');
    
    modal.classList.add('open');
    toggle.classList.add('active');
    this.isOpen = true;
    
    // Focus input
    setTimeout(() => {
      document.getElementById('chatbot-input').focus();
    }, 300);
  }

  closeChat() {
    const modal = document.getElementById('chatbot-modal');
    const toggle = document.getElementById('chatbot-toggle');
    
    modal.classList.remove('open');
    toggle.classList.remove('active');
    this.isOpen = false;
  }

  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    this.showTyping();

    try {
      const response = await this.callGeminiAPI(message);
      this.hideTyping();
      this.addMessage(response, 'bot');
    } catch (error) {
      this.hideTyping();
      this.addMessage('Sorry, I encountered an error. Please try again or contact the school directly at +91-98765 43210.', 'bot');
      console.error('Chatbot error:', error);
    }
  }

  async callGeminiAPI(message) {
    // Refresh page content for each query to get latest info
    this.getPageContent();
    
    const prompt = `${this.schoolContext}\n\nUser question: ${message}\n\nPlease provide a helpful response about Vikas Public School using the information provided above:`;

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid API response:', data);
      throw new Error('Invalid response from API');
    }
    
    return data.candidates[0].content.parts[0].text;
  }

  addMessage(content, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${this.formatMessage(content)}</p>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  formatMessage(content) {
    // Convert line breaks to <br> tags
    content = content.replace(/\n/g, '<br>');
    
    // Convert **text** to <strong>text</strong>
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *text* to <em>text</em>
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return content;
  }

  showTyping() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VPSChatbot();
});