# Digital Product Store

A cute, emotional digital product store built with React and Spring Boot.

## Setup Instructions

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

### Cloudflare Pages Deployment
This frontend is ready to be deployed to Cloudflare Pages as a static SPA.
1. Connect your GitHub repository to Cloudflare Pages.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Set Environment Variable in Cloudflare dashboard:
   - `VITE_API_URL` = `https://your-production-backend-url/api`
*(Note: A `public/_redirects` file is included to handle client-side routing on Cloudflare).*

### Backend Setup (Spring Boot)
1. Navigate to your backend directory.
2. Run the application (usually `mvn spring-boot:run` or via your IDE).
3. The backend should run on `http://localhost:8080`.

## Architectural Notes & Known Limitations

### Chat Architecture Overview
The system clearly differentiates between three distinct conversation/chat concepts:

1. **Buyer Support (`mode = 'buyer'`)**
   - **Table / Entity**: `conversations` (`Conversation.java`)
   - **Purpose**: Buyer <-> Admin support helpdesk chat (ticket/helpdesk flow).
   - **Scoped by**: `(user_id, mode = 'buyer')` (unique constraint ensures exactly one dedicated thread per user).
   - **Channel**: `USER_ADMIN`

2. **Seller VIP Support (`mode = 'seller'`)**
   - **Table / Entity**: `conversations` (`Conversation.java`)
   - **Purpose**: Seller <-> Admin VIP support chat (merchant issues, payouts, onboarding).
   - **Scoped by**: `(user_id, mode = 'seller')` (unique constraint ensures distinct thread from buyer support).
   - **Channel**: `SELLER_ADMIN`

3. **Seller-Customer Chat (`channel = 'USER_SELLER'`)**
   - **Table / Entity**: `seller_chat_threads` (`SellerChatThread.java`) & order-scoped `ChatMessage`
   - **Purpose**: Seller <-> their own customers/buyers discussing specific products, order delivery, and warranty replacements.
   - **Architecture**: Intentionally NOT stored in the `conversations` table — kept completely separate to eliminate any risk of cross-linking with admin support threads.
   - **Scoped by**: `seller_id`, `customer_id` (and/or `order_id`).

### Support Chat Multi-Mode Architecture & Limitations
- **Buyer & Seller Mode Separation**: The marketplace maintains strict backend-level separation between Buyer Support and Seller VIP Support using dedicated `conversations` table rows uniquely keyed by `(user_id, mode)`.
- **Single Admin Role Limitation**: All platform administrators share a single `Role.ADMIN` with access to supervise both Buyer Support and Seller Support inboxes by design. There is currently no sub-role partitioning (e.g. `BUYER_SUPPORT_AGENT` vs `SELLER_SUPPORT_AGENT`). If dedicated sub-tier support staff are hired in the future, role claims and `/api/chat/admin/conversations?mode=X` authorizations can be extended with granular permission checks.
