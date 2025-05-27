const GOOGLE_AUTH_ENDPOINT = 'https://erweima3.com/google_login.php'; // Your authentication endpoint

const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = IS_LOCALHOST ? 'http://localhost:3001' : window.location.origin;

// Function to get the primary domain (e.g., a.com from www.a.com or sub.a.com)
function getPrimaryDomain() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/)) { // IP address or localhost
        return hostname; 
    }
    const parts = hostname.split('.');
    if (parts.length > 2) {
        if (parts[parts.length-2] === 'co' || parts[parts.length-2] === 'com' || parts[parts.length-2] === 'org' || parts[parts.length-2] === 'net') {
            if (parts.length > 3) { 
                 return parts.slice(-3).join('.');
            }
        }
        return parts.slice(-2).join('.');
    }
    return hostname;
}

function handleGoogleLogin() {
    const primaryDomain = getPrimaryDomain();
    const siteUrlForAuth = primaryDomain; 
    const callbackUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const googleLoginUrl = `${GOOGLE_AUTH_ENDPOINT}?url=sz-confort.com;&redirect_uri=${callbackUri}`;
    window.location.href = googleLoginUrl;
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function updateLoginUI() {
    const navAuthLink = document.querySelector('.nav-auth-link');
    const sidebar = document.querySelector('.sidebar'); 

    if (!sidebar) {
        // If on a page without a sidebar (e.g. login, register, privacy), 
        // still check for a generic auth link if one exists (e.g. in a header)
        if (navAuthLink) {
            if (isLoggedIn()) {
                navAuthLink.style.display = 'none'; // Or change to user info/logout
            } else {
                navAuthLink.style.display = 'block';
            }
        }
        return; 
    }

    const existingProfile = sidebar.querySelector('.user-profile-sidebar');
    if (existingProfile) {
        existingProfile.remove();
    }

    if (isLoggedIn()) {
        const userName = localStorage.getItem('name') || 'User';
        const userPicture = localStorage.getItem('picture');
        
        if (navAuthLink) {
            navAuthLink.style.display = 'none'; 
        }

        const userProfileDiv = document.createElement('div');
        userProfileDiv.classList.add('user-profile-sidebar');
        
        let avatarHTML = '';
        if (userPicture) {
            avatarHTML = `<img src="${userPicture}" alt="${userName}" class="user-avatar-sidebar">`;
        } else {
            const firstLetter = userName.charAt(0).toUpperCase();
            avatarHTML = `<div class="user-avatar-sidebar text-avatar">${firstLetter}</div>`;
        }

        userProfileDiv.innerHTML = `
            ${avatarHTML}
            <span class="user-name-sidebar">${userName}</span>
            <div class="user-profile-dropdown">
                <a href="#" id="viewProfileBtnSidebar">View Profile</a>
                <a href="#" id="logoutBtnSidebar">Logout</a>
            </div>
        `;
        
        const sidebarNav = sidebar.querySelector('.sidebar-nav');
        if (sidebarNav) {
            // Insert profile before the first direct child of sidebarNav that is not an auth link or other profile
            // This attempts to place it before the UL or other main nav links
            const firstRealNavItem = sidebarNav.querySelector('ul, a:not(.nav-auth-link):not(.user-profile-sidebar)');
            if (firstRealNavItem) {
                 sidebarNav.insertBefore(userProfileDiv, firstRealNavItem);
            } else {
                 sidebarNav.appendChild(userProfileDiv); // Fallback
            }
        } else { 
            sidebar.insertBefore(userProfileDiv, sidebar.firstChild);
        }

        userProfileDiv.addEventListener('click', (e) => {
            const dropdown = userProfileDiv.querySelector('.user-profile-dropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
        
        const logoutBtn = userProfileDiv.querySelector('#logoutBtnSidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
        const viewProfileBtn = userProfileDiv.querySelector('#viewProfileBtnSidebar');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'view-profile.html'; 
            });
        }

    } else { 
        if (navAuthLink) {
            navAuthLink.style.display = 'block'; 
        }
    }
}

function logout() {
    localStorage.removeItem('google_id');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('picture');
    localStorage.removeItem('token');
    
    updateLoginUI(); 
    
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
         window.location.href = 'index.html';
    } else {
        window.location.reload(); 
    }
}

function checkGoogleLoginCallback() {
    const url = window.location.href;
    if (url.includes('google_id=')) {
        const params = new URLSearchParams(url.split('?')[1]);
        
        const googleId = params.get('google_id');
        const name = params.get('name');
        const email = params.get('email');
        const picture = params.get('picture');
        
        console.log("Google Login Data:", { googleId, name, email, picture });

        if (googleId) localStorage.setItem('google_id', googleId);
        if (name) localStorage.setItem('name', name);
        if (email) localStorage.setItem('email', email);
        if (picture) localStorage.setItem('picture', picture);
        
        const tokenPayload = { googleId, name, email, picture };
        const token = btoa(JSON.stringify(tokenPayload)); 
        localStorage.setItem('token', token);
        
        updateLoginUI(); 

        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html'; 
        }
    }
}

function populateUserProfilePage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const userProfileAvatarImg = document.getElementById('userProfileAvatar');
    const userProfileAvatarText = document.getElementById('userProfileAvatarText');
    const userProfileNameSpan = document.getElementById('userProfileName');
    const userProfileEmailSpan = document.getElementById('userProfileEmail');

    const userName = localStorage.getItem('name') || 'User';
    const userEmail = localStorage.getItem('email') || 'N/A';
    const userPicture = localStorage.getItem('picture');

    if (userPicture) {
        if (userProfileAvatarImg) {
            userProfileAvatarImg.src = userPicture;
            userProfileAvatarImg.alt = userName;
            userProfileAvatarImg.style.display = 'block';
        }
        if (userProfileAvatarText) userProfileAvatarText.style.display = 'none';
    } else {
        if (userProfileAvatarText) {
            userProfileAvatarText.textContent = userName.charAt(0).toUpperCase();
            userProfileAvatarText.style.display = 'flex'; 
        }
        if (userProfileAvatarImg) userProfileAvatarImg.style.display = 'none';
    }

    if (userProfileNameSpan) userProfileNameSpan.textContent = userName;
    if (userProfileEmailSpan) userProfileEmailSpan.textContent = userEmail;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- General Navigation & Sidebar --- 
    const newChatBtnSidebar = document.getElementById('newChatBtnSidebar');
    if (newChatBtnSidebar) {
        newChatBtnSidebar.addEventListener('click', () => {
            window.location.href = 'index.html';
            currentLoadedChatId = null; // Reset when starting a new chat
        });
    }
    const newChatBtnSidebarFeedback = document.getElementById('newChatBtnSidebarFeedback');
    if (newChatBtnSidebarFeedback) {
        newChatBtnSidebarFeedback.addEventListener('click', () => {
            window.location.href = 'index.html';
            currentLoadedChatId = null; // Reset when starting a new chat from feedback page
        });
    }

    // Highlight active page in sidebar
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // --- Chat Interface Specifics (index.html) --- 
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageArea = document.getElementById('messageArea');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const useCaseButtons = document.querySelectorAll('.use-case-btn');
    const imageAspectRatioSelector = document.getElementById('image-aspect-ratio-selector');
    let selectedAspectRatio = null; // Variable to store selected ratio
    let uploadedFileObjects = []; // Store actual File objects for API calls

    function showAspectRatioSelector() {
        if (imageAspectRatioSelector) {
            imageAspectRatioSelector.style.display = 'block';
        }
    }

    function hideAspectRatioSelector() {
        if (imageAspectRatioSelector) {
            imageAspectRatioSelector.style.display = 'none';
        }
        // Reset selected button visual state if needed when hiding
        const currentSelected = imageAspectRatioSelector ? imageAspectRatioSelector.querySelector('.aspect-ratio-btn.selected') : null;
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        selectedAspectRatio = null; // Clear selected ratio
    }

    if (imageAspectRatioSelector) {
        const ratioButtons = imageAspectRatioSelector.querySelectorAll('.aspect-ratio-btn');
        ratioButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove .selected from previously selected button
                const currentSelected = imageAspectRatioSelector.querySelector('.aspect-ratio-btn.selected');
                if (currentSelected) {
                    currentSelected.classList.remove('selected');
                }
                // Add .selected to clicked button
                button.classList.add('selected');
                selectedAspectRatio = button.dataset.ratio;
                console.log('Selected Aspect Ratio:', selectedAspectRatio);
                // Optionally, hide selector after selection or require explicit send
                // hideAspectRatioSelector(); 
            });
        });
    }

    // Function to add a message to the chat area
    function addMessageToChat(text, sender, imageUrl = null) {
        if (!messageArea) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (imageUrl) {
            const imgContainer = document.createElement('div'); // Container for image and button
            imgContainer.classList.add('image-message-container');

            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            
            if (sender === 'bot') { // Style for AI generated images
                imgElement.alt = "एआई द्वारा उत्पन्न छवि";
                imgElement.classList.add('generated-image-display'); // Class for larger display

                const downloadBtn = document.createElement('a');
                downloadBtn.href = imageUrl;
                downloadBtn.download = `generated_image_${Date.now()}.png`; // Suggest a filename
                downloadBtn.textContent = 'तस्वीरें डाउनलोड करें'; // Download Text
                downloadBtn.classList.add('download-image-btn');
                imgContainer.appendChild(downloadBtn); // Add button first or last based on desired layout
            } else { // Style for user uploaded images in chat
                imgElement.alt = "उपयोगकर्ता द्वारा अपलोड की गई छवि";
                imgElement.classList.add('user-image-display'); // Class for user image display in chat
            }
            imgContainer.insertBefore(imgElement, imgContainer.firstChild); // Image before button
            messageDiv.appendChild(imgContainer);
        }
        
        if (text) { // Only process text if it exists
            if (sender === 'bot') {
                const paragraphs = text.split(/\r\n|\n|\r/); // Split by newlines (Windows, Unix, old Mac)
                paragraphs.forEach(paraText => {
                    if (paraText.trim() !== '') { // Avoid creating empty paragraphs
                        const pElement = document.createElement('p');
                        pElement.textContent = paraText;
                        messageDiv.appendChild(pElement);
                    }
                });
            } else {
                // For user messages, keep as a single paragraph or handle differently if needed
                const pElement = document.createElement('p');
                pElement.textContent = text;
                messageDiv.appendChild(pElement);
            }
        }
        
        // If messageDiv is empty (e.g. image-only message from user with no text), 
        // but we still want to append it (e.g. for the image itself)
        if (messageDiv.hasChildNodes()) {
            messageArea.appendChild(messageDiv);
            messageArea.scrollTop = messageArea.scrollHeight; // Scroll to bottom
        }
        return messageDiv; // Return the created message div for potential manipulation (e.g., removing processing message)
    }

    // Определяем системные подсказки для каждого сценария
    const systemPrompts = {
        general: "आप एक सहायक सामान्य सहायक हैं।",
        education: "आप एक शैक्षिक सहायक हैं। उपयोगकर्ता को अवधारणाओं को समझने और प्रभावी ढंग से सीखने में मदद करें।",
        translation: "आप एक अनुवाद सहायक हैं। उपयोगकर्ता के पाठ का सटीक और स्वाभाविक रूप से अनुवाद करें।",
        data_analysis: "आप एक डेटा विश्लेषण सहायक हैं। अंतर्दृष्टि प्रदान करें और डेटा-संबंधी प्रश्नों में मदद करें।",
        screenwriting: "आप एक पटकथा लेखन सहायक हैं। रचनात्मक विचारों और स्क्रिप्ट लेखन में उपयोगकर्ता की मदद करें।",
        media_ops: "आप एक मीडिया संचालन सहायक हैं। सामग्री योजना और विपणन रणनीतियों पर सलाह दें।"
        // Для image_parsing, ai_drawing, image_to_image API-вызовы будут другими (пока не реализуем)
    };
    let currentSystemPrompt = systemPrompts.general;
    let currentUseCaseKey = 'general';
    let currentLoadedChatId = null; // Track the currently loaded chat ID

    // --- Chat History Management ---
    const MAX_HISTORY_ITEMS = 50; // Maximum number of history items to store
    const MAX_TITLE_LENGTH = 30; // Max length for chat titles

    function getChatHistory() {
        const history = localStorage.getItem('chatHistory');
        return history ? JSON.parse(history) : [];
    }

    function saveChatHistory(history) {
        localStorage.setItem('chatHistory', JSON.stringify(history.slice(-MAX_HISTORY_ITEMS)));
        loadChatHistory(); // Refresh the display
    }

    function addConversationToHistory(messages, titlePrefix = "चैट") {
        if (!messages || messages.length === 0) return;

        let history = getChatHistory();
        const userMessages = messages.filter(m => m.sender === 'user' && m.text);
        let title = titlePrefix;

        if (userMessages.length > 0) {
            title = userMessages[0].text.substring(0, MAX_TITLE_LENGTH);
            if (userMessages[0].text.length > MAX_TITLE_LENGTH) {
                title += "...";
            }
        } else if (messages.length > 0 && messages[0].text) { // Fallback if no user text but other text exists
            title = messages[0].text.substring(0, MAX_TITLE_LENGTH);
             if (messages[0].text.length > MAX_TITLE_LENGTH) {
                title += "...";
            }
        } else if (messages.some(m => m.imageUrl)) {
            title = "छवि चैट " + new Date().toLocaleTimeString();
        }


        const conversation = {
            id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            messages: messages,
            timestamp: Date.now()
        };
        history.push(conversation);
        saveChatHistory(history);
    }

    function appendMessagesToCurrentChatOrStartNew(newMessages, titlePrefixIfNew = "चैट") {
        if (!newMessages || newMessages.length === 0) return;
        let history = getChatHistory();
        if (currentLoadedChatId) {
            const existingChat = history.find(chat => chat.id === currentLoadedChatId);
            if (existingChat) {
                existingChat.messages.push(...newMessages);
                existingChat.timestamp = Date.now(); // Update timestamp to reflect recent activity
                // Optionally, update title if it was generic and new messages provide better context
                // For simplicity, we'll keep the original title unless explicitly renamed by user.
            } else {
                // Loaded chat ID was set, but chat not found (edge case, maybe deleted in another tab)
                // Proceed to create a new chat entry
                currentLoadedChatId = null; // Reset, as we couldn't find it
                addConversationToHistory(newMessages, titlePrefixIfNew);
                return; // Exit early as addConversationToHistory calls saveChatHistory
            }
        } else {
            addConversationToHistory(newMessages, titlePrefixIfNew);
            return; // Exit early as addConversationToHistory calls saveChatHistory
        }
        saveChatHistory(history); // Save if we appended to an existing chat
    }

    // --- End Chat History Management ---

    if (sendMessageBtn && chatInput) {
        sendMessageBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        
        if (messageText === '' && uploadedFileObjects.length === 0 && !['ai_drawing', 'image_to_image', 'image_parsing'].includes(currentUseCaseKey)) {
            return;
        } else if (messageText === '' && currentUseCaseKey === 'ai_drawing') {
            alert("कृपया बताएं कि आप क्या बनाना चाहते हैं।");
            return;
        } else if (uploadedFileObjects.length === 0 && (currentUseCaseKey === 'image_to_image' || currentUseCaseKey === 'image_parsing')) {
            alert("इस फ़ंक्शन के लिए कृपया एक छवि अपलोड करें।");
            return;
        }

        let currentConversationMessages = [];

        // Display user's complete message (text + image) first for relevant use cases
        if (['image_to_image', 'image_parsing'].includes(currentUseCaseKey)) {
            if (messageText !== '') {
                addMessageToChat(messageText, 'user');
                currentConversationMessages.push({ sender: 'user', text: messageText, timestamp: Date.now() });
            }
            uploadedFileObjects.forEach(fileObj => {
                const imageURLForDisplay = URL.createObjectURL(fileObj);
                addMessageToChat("", 'user', imageURLForDisplay); 
                currentConversationMessages.push({ 
                    sender: 'user', 
                    imageUrl: imageURLForDisplay, 
                    originalFileName: fileObj.name, 
                    timestamp: Date.now() 
                });
                // Consider revoking imageURLForDisplay after API call in handleImageToImage/handleImageParsing to free memory
            });
        } else if (currentUseCaseKey !== 'ai_drawing') { // For other text/image cases (not pure drawing which has no initial image)
            if (messageText !== '') {
                addMessageToChat(messageText, 'user');
                currentConversationMessages.push({ sender: 'user', text: messageText, timestamp: Date.now() });
            }
            uploadedFileObjects.forEach(fileObj => {
                const imageURLForDisplay = URL.createObjectURL(fileObj);
                addMessageToChat("", 'user', imageURLForDisplay);
                currentConversationMessages.push({ sender: 'user', imageUrl: imageURLForDisplay, originalFileName: fileObj.name, timestamp: Date.now() });
            });
        } else if (messageText !== '' && currentUseCaseKey === 'ai_drawing') {
             // For AI drawing, only display the prompt as user message initially
            addMessageToChat(messageText, 'user');
            currentConversationMessages.push({ sender: 'user', text: messageText, timestamp: Date.now() });
        }

        const originalChatInputValue = chatInput.value; 
        chatInput.value = '';
        imagePreviewContainer.innerHTML = ''; 

        // Проверяем, относится ли текущий сценарий к тем, для которых мы вызываем API
        const textBasedUseCases = ['general', 'education', 'translation', 'data_analysis', 'screenwriting', 'media_ops'];
        
        // --- New API call logic based on use case ---
        if (currentUseCaseKey === 'ai_drawing') {
            await handleAIDrawing(originalChatInputValue, currentConversationMessages);
        } else if (currentUseCaseKey === 'image_to_image') {
            await handleImageToImage(originalChatInputValue, currentConversationMessages);
        } else if (currentUseCaseKey === 'image_parsing') {
            await handleImageParsing(originalChatInputValue, currentConversationMessages);
        } else if (textBasedUseCases.includes(currentUseCaseKey)) {
            // Existing logic for text-based chat APIs
            const processingMessageDiv = addMessageToChat("मैं आपके अनुरोध पर कार्रवाई कर रहा हूँ...", 'bot');
            try {
                const response = await fetch(`${API_BASE_URL}/api/chat`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userMessage: originalChatInputValue, 
                        systemMessage: currentSystemPrompt,
                        useCase: currentUseCaseKey
                    }),
                });
    
                if (processingMessageDiv && processingMessageDiv.parentNode) {
                    processingMessageDiv.remove(); 
                }
    
                if (!response.ok) {
                    let errorTextFromServer = `सर्वर त्रुटि: ${response.status} ${response.statusText}`;
                    try {
                        const errorBodyText = await response.text();
                        if (errorBodyText) {
                            try {
                                const errorJson = JSON.parse(errorBodyText);
                                errorTextFromServer = errorJson.error || JSON.stringify(errorJson);
                            } catch (jsonParseError) {
                                errorTextFromServer = errorBodyText.substring(0, 200);
                            }
                        }
                    } catch (e) {
                        console.error("त्रुटि प्रतिक्रिया निकाय को पढ़ा नहीं जा सका", e);
                    }
                    console.error("बैकएंड से त्रुटि:", errorTextFromServer);
                    const errorMessageContent = `त्रुटि: ${errorTextFromServer}`;
                    addMessageToChat(errorMessageContent, 'bot');
                    currentConversationMessages.push({ sender: 'bot', text: errorMessageContent, timestamp: Date.now() });
                    appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "चैट में त्रुटि");
                    return;
                }
    
                const data = await response.json();
                addMessageToChat(data.botResponse, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: data.botResponse, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages);
    
            } catch (error) {
                console.error('Error sending message to backend:', error);
                if (processingMessageDiv && processingMessageDiv.parentNode) {
                    processingMessageDiv.remove(); 
                }
                const networkErrorMessage = 'नेटवर्क त्रुटि: AI सेवा से कनेक्ट नहीं हो सका। कृपया सुनिश्चित करें कि बैकएंड सर्वर चल रहा है और पहुंच योग्य है।';
                addMessageToChat(networkErrorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: networkErrorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "नेटवर्क त्रुटि");
            }
        } else {
            // Fallback for use cases not yet fully implemented with specific API calls
            setTimeout(() => {
                addMessageToChat(`"${currentUseCaseKey}" के लिए AI प्रतिक्रिया (मॉडल का उपयोग करके: qwen-plus) इस संस्करण में सीधे API कॉल के लिए अभी तक पूरी तरह से लागू नहीं की गई है। इसके लिए प्रतिक्रिया का अनुकरण किया जा रहा है: ${originalChatInputValue}`, 'bot');
            }, 500);
        }
        // --- End of new API call logic ---

        uploadedFileObjects = []; // Clear stored file objects after processing

        // Check for keywords to show aspect ratio selector
        const imageKeywords = ['draw', 'generate', 'create', '画', '生成', '创作'];
        const messageTextLower = messageText.toLowerCase();
        if (imageKeywords.some(keyword => messageTextLower.includes(keyword.toLowerCase()))) {
            showAspectRatioSelector();
        } else {
            if (uploadedFileObjects.length === 0) {
                 hideAspectRatioSelector();
            }
        }
    }

    // --- Handler for AI Drawing (Text-to-Image via your backend) ---
    async function handleAIDrawing(prompt, currentConversationMessages) {
        addMessageToChat(`"${prompt}" के लिए छवि उत्पन्न की जा रही है... इसमें थोड़ा समय लग सकता है।`, 'bot');
        currentConversationMessages.push({ sender: 'bot', text: `"${prompt}" के लिए छवि उत्पन्न की जा रही है...`, timestamp: Date.now() });

        try {
            // IMPORTANT: You need to create this backend endpoint.
            // It will take the prompt, call the DashScope API (POST then GET for results),
            // and return the final image URL or an error.
            const response = await fetch(`${API_BASE_URL}/api/generate-image`, { // Placeholder backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    size: getPixelSize(selectedAspectRatio) // Pass selected aspect ratio or default
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `सर्वर त्रुटि: ${response.status}` }));
                const errorMessage = errorData.error || `छवि उत्पन्न करने में विफल। स्थिति: ${response.status}`;
                addMessageToChat(errorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: errorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "एआई ड्राइंग त्रुटि");
                return;
            }

            const data = await response.json();
            if (data.imageUrl) {
                addMessageToChat("यहाँ आपकी उत्पन्न छवि है:", 'bot', data.imageUrl);
                currentConversationMessages.push({ sender: 'bot', text: "उत्पन्न छवि:", imageUrl: data.imageUrl, timestamp: Date.now() });
            } else {
                addMessageToChat("प्रतिक्रिया से छवि URL प्राप्त नहीं किया जा सका।", 'bot');
                currentConversationMessages.push({ sender: 'bot', text: "छवि URL प्राप्त नहीं किया जा सका।", timestamp: Date.now() });
            }
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages);

        } catch (error) {
            console.error('handleAIDrawing में त्रुटि:', error);
            const netError = 'नेटवर्क त्रुटि या छवि निर्माण सेवा से कनेक्ट करने में समस्या।';
            addMessageToChat(netError, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: netError, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "एआई ड्राइंग नेटवर्क त्रुटि");
        }
        hideAspectRatioSelector(); // Hide after attempting generation
    }

    // --- Handler for Image-to-Image (via erweima3.com/api/ai/call) ---
    async function handleImageToImage(prompt, currentConversationMessages) {
        if (uploadedFileObjects.length === 0) {
            addMessageToChat("इमेज-टू-इमेज के लिए कृपया पहले एक छवि अपलोड करें।", 'bot');
            return;
        }
        const selectedImage = uploadedFileObjects[0]; // We only allow one for this

        addMessageToChat(`शैली के साथ छवि संसाधित की जा रही है: "${prompt || 'डिफ़ॉल्ट'}"...`, 'bot');
        currentConversationMessages.push({ sender: 'bot', text: `शैली के साथ छवि संसाधित की जा रही है: "${prompt || 'डिफ़ॉल्ट'}"...`, timestamp: Date.now() });

        const formData = new FormData();
        const google_id = localStorage.getItem('google_id');
        formData.append('google_id', google_id || '');
        formData.append('model_id', '5'); // Model ID for Qwen sketch-to-image
        formData.append('img', selectedImage);
        // The prompt here could be a style description or transformation instruction
        formData.append('content', prompt || 'Convert to sketch style'); 
        formData.append('size', getPixelSize(selectedAspectRatio)); // Added size parameter

        try {
            const response = await fetch('https://aa.jstang.cn/api/ai/call', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `इमेज-टू-इमेज एपीआई त्रुटि: ${response.status} - ${errorText.substring(0,100)}`;
                addMessageToChat(errorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: errorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "इमेज-टू-इमेज त्रुटि");
                return;
            }

            const data = await response.json();
            console.log("इमेज-टू-इमेज एपीआई प्रतिक्रिया डेटा:", data); // Log the full response
            if (data.data && typeof data.data === 'string') { // Assuming data.data is the image URL
                addMessageToChat("संसाधित छवि:", 'bot', data.data);
                currentConversationMessages.push({ sender: 'bot', text: "संसाधित छवि:", imageUrl: data.data, timestamp: Date.now() });
            } else {
                addMessageToChat("एपीआई प्रतिक्रिया से संसाधित छवि यूआरएल प्राप्त नहीं किया जा सका।", 'bot');
                currentConversationMessages.push({ sender: 'bot', text: "संसाधित छवि यूआरएल प्राप्त नहीं किया जा सका।", timestamp: Date.now() });
            }
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages);

        } catch (error) {
            console.error('handleImageToImage में त्रुटि:', error);
            const netError = 'नेटवर्क त्रुटि या इमेज-टू-इमेज सेवा के साथ समस्या।';
            addMessageToChat(netError, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: netError, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "इमेज-टू-इमेज नेटवर्क त्रुटि");
        }
        hideAspectRatioSelector(); 
    }

    // --- Handler for Image Parsing (Image-to-Prompt via erweima3.com/api/ai/call) ---
    async function handleImageParsing(prompt, currentConversationMessages) {
        if (uploadedFileObjects.length === 0) {
            addMessageToChat("इमेज पार्सिंग के लिए कृपया पहले एक छवि अपलोड करें।", 'bot');
            return;
        }
        const selectedImage = uploadedFileObjects[0];

        addMessageToChat(`छवि का विश्लेषण किया जा रहा है... (अतिरिक्त निर्देश: "${prompt || 'कोई नहीं'}")`, 'bot');
        currentConversationMessages.push({ sender: 'bot', text: `छवि का विश्लेषण किया जा रहा है...`, timestamp: Date.now() });

        const formData = new FormData();
        const google_id = localStorage.getItem('google_id');
        formData.append('google_id', google_id || '');
        formData.append('model_id', '4'); // Model ID for Qwen image analysis
        formData.append('img', selectedImage);
        formData.append('content', prompt || 'Describe this image in detail.'); // User query or default instruction
        formData.append('size', getPixelSize(selectedAspectRatio)); // Added size parameter

        try {
            const response = await fetch('https://aa.jstang.cn/api/ai/call', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `इमेज पार्सिंग एपीआई त्रुटि: ${response.status} - ${errorText.substring(0,100)}`;
                addMessageToChat(errorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: errorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "इमेज पार्सिंग त्रुटि");
                return;
            }

            const data = await response.json();
            // Assuming the response for image parsing is in data.data or data.description or similar
            // You might need to adjust based on the actual API response structure for model_id 4
            console.log("इमेज पार्सिंग एपीआई प्रतिक्रिया डेटा:", data); // Log the full response
            const analysisResult = data.data || data.text || data.description || "एपीआई प्रतिक्रिया से विश्लेषण निकाला नहीं जा सका।";
            addMessageToChat(`विश्लेषण परिणाम: ${analysisResult}`, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: `विश्लेषण: ${analysisResult}`, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages);

        } catch (error) {
            console.error('handleImageParsing में त्रुटि:', error);
            const netError = 'नेटवर्क त्रुटि या इमेज पार्सिंग सेवा के साथ समस्या।';
            addMessageToChat(netError, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: netError, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "इमेज पार्सिंग नेटवर्क त्रुटि");
        }
        hideAspectRatioSelector();
    }

    // Image Upload Functionality
    if (uploadImageBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true; // Allow multiple image uploads
        fileInput.style.display = 'none';

        uploadImageBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            let anImageWasUploaded = false;
            uploadedFileObjects = []; // Clear previous files before adding new ones
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    anImageWasUploaded = true;
                    uploadedFileObjects.push(file); // Store the File object
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        addImageToPreview(e.target.result, file.name);
                    };
                    reader.readAsDataURL(file);
                }
            }
            if (anImageWasUploaded) {
                showAspectRatioSelector(); // Show when an image is uploaded
            }
            fileInput.value = ''; 
        });
    }

    function addImageToPreview(src, fileName) {
        if (!imagePreviewContainer) return;

        // Limit number of previews if necessary, e.g., only allow one image for certain APIs
        if (currentUseCaseKey === 'image_to_image' || currentUseCaseKey === 'image_parsing') {
            if (imagePreviewContainer.children.length >= 1) {
                alert('इस फ़ंक्शन के लिए, एक समय में केवल एक छवि संसाधित की जा सकती है। नई छवि पुरानी छवि को बदल देगी।');
                imagePreviewContainer.innerHTML = ''; // Clear existing previews
                uploadedFileObjects = uploadedFileObjects.slice(-1); // Keep only the last added file object
            }
        }

        const previewDiv = document.createElement('div');
        previewDiv.classList.add('image-preview');
        previewDiv.title = fileName; // Show filename on hover

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'छवि पूर्वावलोकन';

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-img-btn');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = () => {
            previewDiv.remove();
        };

        previewDiv.appendChild(img);
        previewDiv.appendChild(deleteBtn);
        imagePreviewContainer.appendChild(previewDiv);
    }

    // Use Case Buttons Functionality
    if (useCaseButtons.length > 0 && chatInput) {
        useCaseButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentUseCaseKey = button.dataset.case; // Обновляем текущий сценарий
                currentSystemPrompt = systemPrompts[currentUseCaseKey] || systemPrompts.general; // Устанавливаем системную подсказку
                handleUseCaseSelection(currentUseCaseKey);
            });
        });
    }

    const promptSuggestionsArea = document.getElementById('prompt-suggestions-area');

    function handleUseCaseSelection(caseKey) {
        let aiWelcomeMessage = "";
        let suggestions = [];

        // Clear existing messages from messageArea before showing new use case
        if (messageArea) {
            messageArea.innerHTML = '';
            currentLoadedChatId = null; // Reset when a use case is selected (starts a new chat context)
        }

        switch (caseKey) {
            case 'general':
                aiWelcomeMessage = "नमस्ते! मैं आपका सामान्य सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?";
                suggestions = [
                    "वसंत के बारे में एक कविता लिखें",
                    "ब्लैक होल क्या है समझाएं",
                    "मुझे एक चुटकुला सुनाओ"
                ];
                break;
            case 'education':
                aiWelcomeMessage = "नमस्ते! मैं आपका शिक्षा सहायक हूँ। क्या आपके अध्ययन के बारे में कोई प्रश्न हैं?";
                suggestions = [
                    "न्यूटन के पहले नियम को समझने में मेरी मदद करें",
                    "मैं अपनी अंग्रेजी लेखन कैसे सुधार सकता हूँ?",
                    "प्रकाश संश्लेषण की प्रक्रिया समझाएं"
                ];
                break;
            case 'translation':
                aiWelcomeMessage = "नमस्ते! मैं आपका अनुवाद सहायक हूँ। आज मैं आपकी किस भाषा में मदद कर सकता हूँ?";
                suggestions = [
                    "फ्रेंच में अनुवाद करें: नमस्ते, आप कैसे हैं?",
                    "अंग्रेजी में अनुवाद करें: 今天天气真好",
                    "जापानी में \"धन्यवाद\" कैसे कहते हैं?"
                ];
                break;
            case 'data_analysis':
                aiWelcomeMessage = "नमस्ते! मैं आपका डेटा विश्लेषण सहायक हूँ। कृपया डेटा प्रदान करें या अपनी विश्लेषण आवश्यकताओं का वर्णन करें।";
                suggestions = [
                    "इस बिक्री डेटा में रुझानों का विश्लेषण करें",
                    "उपयोगकर्ता मंथन के मुख्य कारणों की पहचान करें",
                    "अगली तिमाही के लिए उत्पाद बिक्री की भविष्यवाणी करें"
                ];
                break;
            case 'screenwriting':
                aiWelcomeMessage = "नमस्ते! मैं आपका पटकथा लेखन भागीदार हूँ। क्या आपके पास कोई रोमांचक कहानी विचार है?";
                suggestions = [
                    "एक विज्ञान-कथा फिल्म की शुरुआत लिखें",
                    "एक रहस्य लघु फिल्म के लिए एक कथानक के साथ आने में मेरी मदद करें",
                    "एक यादगार चरित्र कैसे बनाएं?"
                ];
                break;
            case 'media_ops':
                aiWelcomeMessage = "नमस्ते! मैं आपका मीडिया संचालन सलाहकार हूँ। क्या आपको किसी सामग्री रणनीति या प्रचार विचारों की आवश्यकता है?";
                suggestions = [
                    "मुझे कुछ आकर्षक सोशल मीडिया पोस्ट शीर्षक दें",
                    "एक नए उत्पाद के लिए प्रचार योजना कैसे विकसित करें?",
                    "स्वस्थ जीवन पर एक ब्लॉग पोस्ट लिखें"
                ];
                break;
            case 'image_parsing':
                aiWelcomeMessage = "नमस्ते! मैं इमेज पार्सिंग एआई हूँ। कृपया एक छवि अपलोड करें, और मैं इसकी सामग्री को समझने की कोशिश करूँगा।";
                suggestions = [
                    "इस तस्वीर में क्या है?",
                    "छवि में मुख्य वस्तुओं को पहचानें",
                    "इस लैंडस्केप तस्वीर का वर्णन करें"
                ];
                break;
            case 'ai_drawing':
                aiWelcomeMessage = "नमस्ते! मैं एआई ड्राइंग सहायक हूँ। आप क्या बनाना चाहेंगे? अपने विचार का वर्णन करें!";
                suggestions = [
                    "चाँद पर कॉफी पीती हुई एक बिल्ली बनाएँ",
                    "एक साइबरपंक-शैली शहर का रात का दृश्य उत्पन्न करें",
                    "एक प्रभाववादी-शैली का लैंडस्केप पेंटिंग बनाएं"
                ];
                break;
            case 'image_to_image':
                aiWelcomeMessage = "नमस्ते! मैं इमेज-टू-इमेज एआई हूँ। कृपया एक छवि अपलोड करें और मुझे बताएं कि आप इसे कैसे बदलना चाहेंगे।";
                suggestions = [
                    "इस तस्वीर को एनीमे शैली में बदलें",
                    "इस स्केच को रंगीन करें",
                    "छवि में दिन के दृश्य को शाम में परिवर्तित करें"
                ];
                break;
            default:
                aiWelcomeMessage = "नमस्ते! कृपया एक परिदृश्य चुनें या मुझसे सीधे एक प्रश्न पूछें।";
                suggestions = ["मैं आपकी क्या मदद कर सकता हूँ?", "मुझे अपनी ज़रूरतें बताएं", "चलिए चैट करना शुरू करते हैं"];
        }

        addMessageToChat(aiWelcomeMessage, 'bot');
        chatInput.value = ''; // Clear chat input
        chatInput.placeholder = `"${document.querySelector(`.use-case-btn[data-case="${caseKey}"] .use-case-title`).textContent}" के बारे में पूछें...`;

        // Display suggestions
        if (promptSuggestionsArea) {
            promptSuggestionsArea.innerHTML = ''; // Clear previous suggestions
            suggestions.forEach(text => {
                const suggBtn = document.createElement('button');
                suggBtn.classList.add('suggestion-btn');
                suggBtn.textContent = text;
                suggBtn.onclick = () => {
                    chatInput.value = text;
                    chatInput.focus();
                    // Optionally, send message directly or clear suggestions
                    // promptSuggestionsArea.innerHTML = ''; 
                };
                promptSuggestionsArea.appendChild(suggBtn);
            });
        }

        // Modify handleUseCaseSelection to show aspect ratio selector based on case
        const imageRelatedUseCases = ['image_parsing', 'ai_drawing', 'image_to_image'];
        if (imageRelatedUseCases.includes(caseKey)) {
            showAspectRatioSelector();
        } else {
            hideAspectRatioSelector();
        }
    }

    // --- Login Page Specifics (login.html) --- 
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            if (email && password) {
                // Simulate login
                alert('ईमेल के साथ लॉगिन प्रयास: ' + email);
                // Redirect to chat page on successful login (for demo)
                // window.location.href = 'index.html'; 
            } else {
                alert('कृपया सभी फ़ील्ड भरें।');
            }
        });
    }

    // --- Register Page Specifics (register.html) --- 
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (password !== confirmPassword) {
                alert('पासवर्ड मेल नहीं खाते!');
                return;
            }
            if (username && email && password) {
                // Simulate registration
                alert('के लिए पंजीकरण प्रयास: ' + username + ' ईमेल के साथ: ' + email);
                // Redirect to login page on successful registration (for demo)
                // window.location.href = 'login.html'; 
            } else {
                alert('कृपया सभी फ़ील्ड भरें।');
            }
        });
    }
    
    // --- Feedback Page Specifics (feedback.html) ---
    const reviewForm = document.getElementById('reviewForm');
    const reviewsSection = document.querySelector('.reviews-section');
    const avatarUploadInput = document.getElementById('reviewerAvatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    const customFileNameSpan = document.querySelector('.custom-file-name'); // Get the span for file name
    const deleteAvatarPreviewBtn = document.getElementById('deleteAvatarPreviewBtn'); // Get the delete button

    // Avatar Preview Logic
    if (avatarUploadInput && avatarPreview && deleteAvatarPreviewBtn) { // Ensure delete button exists
        avatarUploadInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.src = e.target.result;
                    avatarPreview.style.display = 'block';
                    if (deleteAvatarPreviewBtn) deleteAvatarPreviewBtn.style.display = 'inline-block'; // Show delete button
                }
                reader.readAsDataURL(file);
                if (customFileNameSpan) {
                    customFileNameSpan.textContent = file.name;
                }
            } else {
                avatarPreview.src = '#';
                avatarPreview.style.display = 'none';
                if (deleteAvatarPreviewBtn) deleteAvatarPreviewBtn.style.display = 'none'; // Hide delete button
                if (customFileNameSpan) {
                    customFileNameSpan.textContent = 'कोई फ़ाइल नहीं चुनी गई।';
                }
            }
        });

        // Event listener for the delete avatar preview button
        deleteAvatarPreviewBtn.addEventListener('click', function() {
            avatarPreview.src = '#';
            avatarPreview.style.display = 'none';
            deleteAvatarPreviewBtn.style.display = 'none';
            avatarUploadInput.value = ''; // Clear the file input
            if (customFileNameSpan) {
                customFileNameSpan.textContent = 'कोई फ़ाइल नहीं चुनी गई।';
            }
        });
    }

    // Function to create star string from rating value
    function getStars(rating) {
        const numStars = parseInt(rating);
        if (isNaN(numStars) || numStars <= 0) return 'N/A';
        return '⭐'.repeat(numStars);
    }

    if (reviewForm && reviewsSection) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const reviewerName = reviewForm.reviewerName.value;
            const avatarFile = avatarUploadInput ? avatarUploadInput.files[0] : null;
            const ratingProgramming = reviewForm.ratingProgramming.value;
            const ratingComprehension = reviewForm.ratingComprehension.value;
            const ratingImageProcessing = reviewForm.ratingImageProcessing.value;
            const reviewText = reviewForm.reviewText.value;
            const currentDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

            if (reviewerName && reviewText) {
                const newReviewCard = document.createElement('article');
                newReviewCard.classList.add('review-card');
                newReviewCard.style.transform = 'translateY(20px) scale(0.95)'; // Initial state for animation

                let ratingHTML = '';
                if (ratingProgramming > 0) ratingHTML += `<span>Programming: ${getStars(ratingProgramming)}</span>`;
                if (ratingComprehension > 0) ratingHTML += `<span>Comprehension: ${getStars(ratingComprehension)}</span>`;
                if (ratingImageProcessing > 0) ratingHTML += `<span>Image Processing: ${getStars(ratingImageProcessing)}</span>`;
                else if (ratingImageProcessing === "0") ratingHTML += `<span>Image Processing: N/A</span>`;

                // Avatar logic
                if (avatarFile) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const avatarContent = `<img src="${event.target.result}" alt="${reviewerName}'s avatar">`;
                        newReviewCard.innerHTML = constructReviewCardHTML(reviewerName, currentDate, avatarContent, ratingHTML, reviewText);
                        reviewsSection.insertBefore(newReviewCard, reviewsSection.firstChild);
                    }
                    reader.readAsDataURL(avatarFile);
                } else {
                    const avatarLetter = reviewerName.charAt(0).toUpperCase() || 'U';
                    const avatarContent = `<span>${avatarLetter}</span>`;
                    newReviewCard.innerHTML = constructReviewCardHTML(reviewerName, currentDate, avatarContent, ratingHTML, reviewText);
                    reviewsSection.insertBefore(newReviewCard, reviewsSection.firstChild);
                }

                reviewForm.reset();
                if (avatarPreview) {
                    avatarPreview.src = '#';
                    avatarPreview.style.display = 'none';
                }
                if (deleteAvatarPreviewBtn) { // Hide delete button on form reset
                    deleteAvatarPreviewBtn.style.display = 'none';
                }
                if (customFileNameSpan) { // Reset custom file name display
                    customFileNameSpan.textContent = 'कोई फ़ाइल नहीं चुनी गई।';
                }
                alert('आपकी समीक्षा के लिए धन्यवाद! इसे सूची में सबसे ऊपर जोड़ दिया गया है।');
            } else {
                alert('कृपया अपना नाम और समीक्षा सामग्री भरें।');
            }
        });
    }

    // Animated Review Cards Loop
    let currentReviewIndex = 0;
    const MAX_ANIMATED_REVIEWS = 5; // Limit the number of reviews in the animation cycle

    function animateReviewCardsLoop() {
        const allReviewCardsNodeList = reviewsSection ? reviewsSection.querySelectorAll('.review-card') : null;
        if (!allReviewCardsNodeList || allReviewCardsNodeList.length === 0) {
            setTimeout(animateReviewCardsLoop, 4000); // Retry if cards appear later
            return;
        }
        
        const allReviewCards = Array.from(allReviewCardsNodeList);

        // 1. Reset ALL cards to their initial hidden state first.
        allReviewCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.95)';
            // card.style.transition = 'none'; // Temporarily disable transition for immediate reset
        });

        const cardsToAnimateThisCycle = allReviewCards.slice(0, MAX_ANIMATED_REVIEWS);

        if (cardsToAnimateThisCycle.length === 0) {
            setTimeout(animateReviewCardsLoop, 4000);
            return;
        }

        currentReviewIndex = 0; 
        
        // Use a microtask (like requestAnimationFrame or a 0ms timeout) to ensure the reset styles are applied
        // before we start adding the 'show' styles that trigger the transition.
        setTimeout(() => {
            // allReviewCards.forEach(card => {
            //     // card.style.transition = 'opacity 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)'; // Re-enable transition
            // });
            if (!reviewsSection) return; 
            // Re-fetch and re-slice in case the DOM changed during the brief timeout
            const currentCardsNodeList = reviewsSection.querySelectorAll('.review-card');
            if (!currentCardsNodeList || currentCardsNodeList.length === 0) {
                setTimeout(animateReviewCardsLoop, 4000);
                return;
            }
            const currentBatch = Array.from(currentCardsNodeList).slice(0, MAX_ANIMATED_REVIEWS);
             if (currentBatch.length === 0) {
                setTimeout(animateReviewCardsLoop, 4000);
                return;
            }
            showNextCardInBatch(currentBatch);
        }, 50); // A small delay like 50ms is often more reliable than 0ms for this purpose.
    }

    function showNextCardInBatch(batchToDisplay) { 
        if (!reviewsSection) return;

        if (!batchToDisplay || batchToDisplay.length === 0) {
            setTimeout(animateReviewCardsLoop, 4000); 
            return;
        }

        if (currentReviewIndex < batchToDisplay.length) { 
            const card = batchToDisplay[currentReviewIndex];
            if (card) { 
                card.style.opacity = '1';
                card.style.transform = 'translateY(0px) scale(1)';
            }
            currentReviewIndex++;
            setTimeout(() => showNextCardInBatch(batchToDisplay), 800); 
        } else {
            // Finished displaying this batch, wait then restart the main loop
            // The main loop will handle resetting all cards again.
            setTimeout(animateReviewCardsLoop, 4000);
        }
    }

    if (reviewsSection) {
        // Initial call to start the animation loop for reviews.
        // Cards are initially hidden by CSS, so the loop will animate them in.
        animateReviewCardsLoop(); 
    }

    // Placeholder for loading chat history (example)
    function loadChatHistory() {
        const historyListIndex = document.getElementById('history-list');
        const historyListFeedback = document.getElementById('history-list-feedback');
        const history = getChatHistory();

        // Add "Clear All History" button if it doesn't exist
        if (historyListIndex && !document.getElementById('clearAllHistoryBtn')) {
            const clearAllBtn = document.createElement('button');
            clearAllBtn.textContent = 'सभी इतिहास साफ़ करें';
            clearAllBtn.id = 'clearAllHistoryBtn';
            clearAllBtn.classList.add('clear-history-btn');
            clearAllBtn.addEventListener('click', () => {
                if (confirm('आप निश्चित रूप से सभी इतिहास साफ़ करना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती है।')) {
                    saveChatHistory([]); // Save an empty array
                    if (messageArea) messageArea.innerHTML = ''; // Clear current chat display
                    addMessageToChat("इतिहास साफ़ कर दिया गया है।", "bot");
                }
            });
            // Insert before the history list (ul) or at the top of the sidebar-history-section
            const historySection = historyListIndex.closest('.sidebar-history-section');
            if (historySection) {
                historySection.insertBefore(clearAllBtn, historySection.firstChild);
            } else {
                 historyListIndex.parentNode.insertBefore(clearAllBtn, historyListIndex);
            }
        }
         // Do the same for feedback page if its history list exists
        if (historyListFeedback && !document.getElementById('clearAllHistoryBtnFeedback')) {
            const clearAllBtnFeedback = document.createElement('button');
            clearAllBtnFeedback.textContent = 'सभी इतिहास साफ़ करें';
            clearAllBtnFeedback.id = 'clearAllHistoryBtnFeedback';
            clearAllBtnFeedback.classList.add('clear-history-btn'); // Use same class for styling
            clearAllBtnFeedback.addEventListener('click', () => {
                if (confirm('आप निश्चित रूप से सभी इतिहास साफ़ करना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती है।')) {
                    saveChatHistory([]);
                     // No messageArea on feedback page, so just clear history
                }
            });
            const historySectionFeedback = historyListFeedback.closest('.sidebar-history-section');
             if (historySectionFeedback) {
                historySectionFeedback.insertBefore(clearAllBtnFeedback, historySectionFeedback.firstChild);
            } else {
                historyListFeedback.parentNode.insertBefore(clearAllBtnFeedback, historyListFeedback);
            }
        }


        function populateHistory(listElement) {
            if (!listElement) return;
            listElement.innerHTML = ''; // Clear existing items
            
            if (history.length === 0) {
                const noHistoryItem = document.createElement('li');
                noHistoryItem.textContent = 'कोई इतिहास नहीं';
                noHistoryItem.classList.add('no-history');
                listElement.appendChild(noHistoryItem);
                return;
            }

            history.slice().reverse().forEach(chat => { // Display newest first
                const listItem = document.createElement('li');
                listItem.classList.add('history-item');
                listItem.dataset.chatId = chat.id;

                const titleSpan = document.createElement('span');
                titleSpan.classList.add('history-title');
                titleSpan.textContent = chat.title || 'अशीर्षक चैट';
                titleSpan.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadConversation(chat.id);
                });

                const actionsDiv = document.createElement('div');
                actionsDiv.classList.add('history-item-actions');

                const renameBtn = document.createElement('button');
                renameBtn.innerHTML = '✏️'; // Pencil icon for rename
                renameBtn.title = 'नाम बदलें';
                renameBtn.classList.add('history-action-btn', 'rename-btn');
                renameBtn.addEventListener('click', () => {
                    const newTitle = prompt('नया संवाद शीर्षक दर्ज करें:', chat.title);
                    if (newTitle && newTitle.trim() !== '') {
                        renameConversation(chat.id, newTitle.trim());
                    }
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️'; // Trash icon for delete
                deleteBtn.title = 'हटाएं';
                deleteBtn.classList.add('history-action-btn', 'delete-btn');
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`क्या आप निश्चित रूप से "${chat.title}" को हटाना चाहते हैं?`)) {
                        deleteConversation(chat.id);
                    }
                });

                actionsDiv.appendChild(renameBtn);
                actionsDiv.appendChild(deleteBtn);

                listItem.appendChild(titleSpan);
                listItem.appendChild(actionsDiv);
                listElement.appendChild(listItem);
            });
        }
        populateHistory(historyListIndex);
        populateHistory(historyListFeedback);
    }

    function loadConversation(chatId) {
        const history = getChatHistory();
        const conversation = history.find(c => c.id === chatId);

        if (!conversation) {
            addMessageToChat("संवाद लोड नहीं किया जा सका।", "bot");
            return;
        }

        currentLoadedChatId = conversation.id; // Set the current loaded chat ID

        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            // If not on the main chat page, redirect and pass a parameter to load it
            window.location.href = `index.html?loadChat=${chatId}`;
            return;
        }
        
        if (messageArea) {
            messageArea.innerHTML = ''; // Clear current chat
            conversation.messages.forEach(msg => {
                addMessageToChat(msg.text || "", msg.sender, msg.imageUrl || null);
            });
        }
    }

    function deleteConversation(chatId) {
        let history = getChatHistory();
        history = history.filter(c => c.id !== chatId);
        saveChatHistory(history);
    }

    function renameConversation(chatId, newTitle) {
        let history = getChatHistory();
        const conversation = history.find(c => c.id === chatId);
        if (conversation) {
            conversation.title = newTitle;
        }
        saveChatHistory(history);
    }

    loadChatHistory(); // Load history on page load

    // Custom Pointer Logic
    const customPointer = document.createElement('div');
    customPointer.setAttribute('id', 'custom-pointer');
    customPointer.innerHTML = '👆'; // Emoji pointer
    document.body.appendChild(customPointer);

    document.addEventListener('mousemove', (e) => {
        customPointer.style.left = e.pageX + 'px';
        customPointer.style.top = e.pageY + 'px';
    });

    // Hide default cursor on interactive elements if desired, or globally on body (see CSS)
    // document.querySelectorAll('button, a, input, textarea, .use-case-btn').forEach(el => {
    //     el.style.cursor = 'none'; 
    // });

    // --- Login Interception for Chat Functionality on index.html ---
    if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        const chatInputForLogin = document.getElementById('chatInput');
        const sendMessageBtnForLogin = document.getElementById('sendMessageBtn');
        const uploadImageBtnForLogin = document.getElementById('uploadImageBtn');

        const requireLoginAndRedirect = (event, elementToDisableTemporarily = null) => {
            if (!isLoggedIn()) {
                if (event) { 
                    event.preventDefault(); 
                    event.stopPropagation();
                }
                alert('चैट सुविधाओं का उपयोग करने के लिए कृपया लॉग इन करें।');
                if (elementToDisableTemporarily && typeof elementToDisableTemporarily.setAttribute === 'function') {
                    elementToDisableTemporarily.setAttribute('disabled', 'true');
                }
                window.location.href = 'login.html';
                return false; 
            }
            // If logged in and element was disabled, re-enable it (though page redirect makes this less critical)
            if (elementToDisableTemporarily && typeof elementToDisableTemporarily.removeAttribute === 'function') {
                 elementToDisableTemporarily.removeAttribute('disabled');
            }
            return true; 
        };

        if (chatInputForLogin) {
            chatInputForLogin.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    // Pass chatInputForLogin to be potentially disabled if redirect occurs
                    if (!requireLoginAndRedirect(e, chatInputForLogin)) {
                        // Login required, redirect initiated
                    }
                }
            }, true); 

            chatInputForLogin.addEventListener('focus', (e) => {
                requireLoginAndRedirect(e, chatInputForLogin);
            });
        }

        if (sendMessageBtnForLogin) {
            sendMessageBtnForLogin.addEventListener('click', (e) => { 
                 requireLoginAndRedirect(e, sendMessageBtnForLogin);
            }, true); 
        }
        if (uploadImageBtnForLogin) {
            uploadImageBtnForLogin.addEventListener('click', (e) => { 
                 requireLoginAndRedirect(e, uploadImageBtnForLogin);
            }, true); 
        }
    }

    // Call initializers that depend on DOM being ready AND localStorage potentially being set by callbacks
    checkGoogleLoginCallback(); 
    updateLoginUI(); 

    // Check if we need to load a specific chat on page load (e.g., after redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const chatToLoad = urlParams.get('loadChat');
    if (chatToLoad && (window.location.pathname === '/index.html' || window.location.pathname === '/')) {
        // Ensure DOM is fully ready, especially messageArea
        // setTimeout(() => loadConversation(chatToLoad), 0); // Use timeout to ensure messageArea is available
        // A more robust way is to ensure loadConversation is called after DOMContentLoaded
        // Since this whole script is wrapped in DOMContentLoaded, it should be fine.
        // However, if loadChatHistory was populating things needed by loadConversation,
        // make sure order of operations is correct. `loadChatHistory` is called earlier.
        loadConversation(chatToLoad);
        // Clean the URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    // Attach Google login handlers to buttons on Login and Register pages
    const googleLoginButtons = document.querySelectorAll('.google-login-btn');
    googleLoginButtons.forEach(button => {
        button.addEventListener('click', handleGoogleLogin);
    });

    // Call specific page initializers if they exist
    if (window.location.pathname.endsWith('view-profile.html')) {
        populateUserProfilePage();
    }
});

function getPixelSize(ratio) {
    if (!ratio) return "1024*1024"; // Default if no ratio selected

    switch (ratio) {
        case "1:1": return "1024*1024";
        case "16:9": return "1344*768"; 
        case "9:16": return "768*1344"; 
        case "4:3": return "1024*768";
        case "3:4": return "768*1024";
        default: return "1024*1024"; // Fallback
    }
} 