import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

// Flag to prevent multiple initializations
let chatInitialized = false;

export const N8nChatWidget = () => {
	const location = useLocation();
	const chatInitializedRef = useRef(false);

	// Don't render chat on landing page (/) or auth page (/auth)
	if (location.pathname === '/' || location.pathname === '/auth') {
		return null;
	}

	useEffect(() => {
		// Prevent multiple initializations (fixes "already an app instance mounted" error)
		if (chatInitializedRef.current || chatInitialized) {
			console.log('💬 N8n Chat Widget: Already initialized, skipping...');
			return;
		}

		const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

		if (!webhookUrl) {
			console.warn(
				'⚠️ N8n Chat Widget: VITE_N8N_WEBHOOK_URL is not configured. Chat widget will not be initialized.'
			);
			return;
		}

		// Validate webhook URL format
		if (!webhookUrl.startsWith('http')) {
			console.error(
				'❌ N8n Chat Widget: Invalid webhook URL format. Must start with http:// or https://'
			);
			return;
		}

		console.log('🚀 N8n Chat Widget: Initializing with webhook:', webhookUrl);

		try {
			// Intercept console errors to handle CORS and network errors gracefully
			const originalError = console.error;
			console.error = (...args: any[]) => {
				// Only suppress N8N chat-related CORS errors
				const errorStr = args[0]?.toString() || '';
				if (errorStr.includes('Access to fetch') && errorStr.includes('CORS')) {
					console.log('⚠️ N8n Chat Widget: CORS error detected - webhook may not allow this origin');
					console.log('   Fix: In n8n Chat Trigger → Settings → Allow Origins → Add http://localhost:5173');
					return;
				}
				// Call original error for other errors
				originalError.apply(console, args);
			};

			// Initialize the n8n chat with custom configuration
			createChat({
				webhookUrl: webhookUrl,
				webhookConfig: {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					}
				},
				target: '#n8n-chat',
				mode: 'window',
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

			// Restore original console.error
			console.error = originalError;

			// Mark as initialized to prevent re-initialization
			chatInitializedRef.current = true;
			chatInitialized = true;

			console.log('✅ N8n Chat Widget: Initialized successfully');

			// Add event listeners for debugging
			const chatContainer = document.getElementById('n8n-chat');
			if (chatContainer) {
				console.log('👀 N8n Chat Widget: Chat container found');

				// Listen for form submissions (message sending)
				const observer = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type === 'childList') {
							const forms = chatContainer.querySelectorAll('form');
							forms.forEach((form) => {
								if (!form.hasAttribute('data-chat-listener')) {
									form.setAttribute('data-chat-listener', 'true');
									form.addEventListener('submit', () => {
										const input = form.querySelector('textarea, input[type="text"]') as HTMLInputElement | HTMLTextAreaElement;
										if (input?.value) {
											console.log('📤 Message sent:', input.value);
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
			}

			return () => {
				// Cleanup
				console.error = originalError;
			};
		} catch (error) {
			console.error('❌ N8n Chat Widget: Initialization error:', error);
			// Mark as initialized even on error to prevent retries
			chatInitializedRef.current = true;
			chatInitialized = true;
		}

	}, [location.pathname]);

	// The chat widget will render in this target element
	return (
		<>
			<style>
				{`
					/* Custom styles for n8n chat widget */
					#n8n-chat textarea {
						color: #000000 !important;
						background-color: #ffffff !important;
					}
					#n8n-chat textarea::placeholder {
						color: #999999 !important;
					}
					#n8n-chat textarea:focus {
						color: #000000 !important;
						border-color: #3b82f6 !important;
					}
					/* Ensure chat widget is visible and not blocked */
					#n8n-chat {
						z-index: 9999 !important;
					}
				`}
			</style>
			<div id="n8n-chat"></div>
		</>
	);
};

