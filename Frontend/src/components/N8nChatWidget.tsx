import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export const N8nChatWidget = () => {
	const location = useLocation();

	// Don't render chat on landing page (/) or auth page (/auth)
	if (location.pathname === '/' || location.pathname === '/auth') {
		return null;
	}

	useEffect(() => {
		const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

		if (!webhookUrl) {
			console.warn(
				'N8n Chat Widget: VITE_N8N_WEBHOOK_URL is not configured. Chat widget will not be initialized.'
			);
			return;
		}

		console.log('🚀 N8n Chat Widget: Initializing with webhook:', webhookUrl);

		// Initialize the n8n chat with custom configuration
		createChat({
			webhookUrl: webhookUrl,
			webhookConfig: {
				method: 'POST',
				headers: {}
			},
			target: '#n8n-chat',
			mode: 'window', // 'window' for floating chat, 'fullscreen' for full page
			showWelcomeScreen: true,
			chatInputKey: 'chatInput',
			chatSessionKey: 'sessionId',
			loadPreviousSession: true,
			defaultLanguage: 'en',
			initialMessages: [
				'Hola! 👋',
				'Soy tu asistente virtual de AhorrAI. ¿Cómo puedo ayudarte a optimizar tus finanzas?'
			],
			i18n: {
				en: {
					title: 'AhorrAI Assistant',
					subtitle: 'Obtener Informacion Financiera Personalizada. Disponible 24/7.',
					footer: '',
					getStarted: 'Nueva Conversación',
					inputPlaceholder: 'Escribe tu pregunta...',
					closeButtonTooltip: 'Cerrar',
				},
			},
			enableStreaming: false,
			allowFileUploads: false,
		});

		console.log('✅ N8n Chat Widget: Initialized successfully');

		// Add event listeners for debugging
		const chatContainer = document.getElementById('n8n-chat');
		if (chatContainer) {
			console.log('👀 N8n Chat Widget: Chat container found, adding event listeners');

			// Listen for form submissions (message sending)
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'childList') {
						const forms = chatContainer.querySelectorAll('form');
						forms.forEach((form) => {
							if (!form.hasAttribute('data-chat-listener')) {
								form.setAttribute('data-chat-listener', 'true');
								form.addEventListener('submit', () => {
									console.log('📤 N8n Chat Widget: Message being sent');
									const input = form.querySelector('textarea, input[type="text"]') as HTMLInputElement | HTMLTextAreaElement;
									if (input) {
										console.log('📤 Message content:', input.value);
									}
								});
							}
						});
					}
				});
			});

			observer.observe(chatContainer, {
				childList: true,
				subtree: true
			});

			// Listen for network requests
			const originalFetch = window.fetch;
			window.fetch = function(...args) {
				const url = args[0];
				if (typeof url === 'string' && url.includes('webhook')) {
					console.log('🌐 N8n Chat Widget: Making request to webhook:', url);
					if (args[1] && args[1].body) {
						try {
							// Convert body to string if it's not already
							let bodyString = args[1].body;
							if (bodyString instanceof FormData) {
								console.log('🌐 Request body: FormData (cannot parse easily)');
							} else if (typeof bodyString === 'string') {
								const body = JSON.parse(bodyString);
								console.log('🌐 Request body:', body);
							} else {
								console.log('🌐 Request body (raw):', bodyString);
							}
						} catch (e) {
							console.log('🌐 Request body (raw):', args[1].body);
						}
					}
				}
				return originalFetch.apply(this, args).then(response => {
					if (typeof url === 'string' && url.includes('webhook')) {
						console.log('🌐 N8n Chat Widget: Response status:', response.status);
						if (!response.ok) {
							console.error('❌ N8n Chat Widget: Request failed with status:', response.status);
						} else {
							console.log('✅ N8n Chat Widget: Request successful');
						}
					}
					return response;
				}).catch(error => {
					if (typeof url === 'string' && url.includes('webhook')) {
						console.error('❌ N8n Chat Widget: Network error:', error);
					}
					throw error;
				});
			};
		}

	}, []);

	// The chat widget will render in this target element
	return (
		<>
			<style>
				{`
					/* Custom styles for n8n chat widget */
					#n8n-chat textarea {
						color: #000000 !important; /* Black text color for input */
					}
					#n8n-chat textarea::placeholder {
						color: #666666 !important; /* Gray placeholder text */
					}
					#n8n-chat textarea:focus {
						color: #000000 !important; /* Ensure black text when focused */
					}
				`}
			</style>
			<div id="n8n-chat"></div>
		</>
	);
};
