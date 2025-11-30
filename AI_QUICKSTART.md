# 🚀 AI Features Quick Start Guide

## Testing the New AI Features

### 1. Start Your Development Server

```bash
# Terminal 1 - Frontend
cd /Applications/XAMPP/xamppfiles/htdocs/Event-yetu/frontend
npm run dev
```

Your app should be running at: **http://localhost:5175/**

### 2. Login as a Client

- Navigate to `http://localhost:5175/login`
- Login with a client account
- You'll be redirected to the Client Dashboard

---

## 🌟 Feature Demos

### ✨ Smart Recommendations (Client Dashboard)

**Default Landing**: The dashboard now opens to the **"For You"** tab

**What You'll See:**
1. **Recommended For You** section
   - Personalized badge if you have booking history
   - 4 service cards with recommendation reasons
   - Click any card to view service details

2. **Trending This Month** section
   - Top 3 trending services with 🔥 badges
   - Numbered rankings (#1, #2, #3)
   - Recent booking counts

3. **AI Insights Card**
   - Explains the recommendation engine
   - Shows AI capabilities

**Try It:**
- Create some bookings first
- Return to "For You" tab
- Recommendations will be personalized based on your history
- New users see popular services instead

---

### 💬 AI Chat Assistant (All Pages)

**Where to Find It:**
- Look for the **purple floating button** at bottom-right corner
- Shows a 🤖 icon with a green pulse indicator
- Hover to see "Chat with AI Assistant" tooltip

**Click to Open:**
- Beautiful chat window appears
- Auto-greeting with your name
- Shows quick action buttons

**Quick Actions:**
1. 📈 Show trending services
2. ⭐ Recommend services for me
3. 🎯 What are popular categories?
4. 💡 Event planning tips

**Try These Queries:**
```
"Show me trending services"
"Recommend services for me"
"What are popular categories?"
"Give me event planning tips"
"How much does catering cost?"
"How do I book a service?"
"What categories do you have?"
```

**Chat Features:**
- Real-time responses with typing animation
- Message timestamps
- Smooth scrolling
- Minimizes to floating button
- Works across all pages

---

### 📊 Provider Insights (Coming to Provider Dashboard)

**Access via API:**
```bash
# Test the insights endpoint
curl -X GET \
  'http://localhost/Event-yetu/backend/api/ai.php?action=provider-insights' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

**Insights Include:**
- 📈 High demand alerts
- ⭐ Top performing categories
- 💰 Pricing competitiveness
- 🎄 Seasonal trends
- Performance metrics

---

## 🧪 Testing the AI Endpoints

### 1. Service Recommendations
```bash
curl -X GET \
  'http://localhost/Event-yetu/backend/api/ai.php?action=service-recommendations' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 2. Trending Services
```bash
curl -X GET \
  'http://localhost/Event-yetu/backend/api/ai.php?action=trending-services' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 3. Demand Forecast
```bash
curl -X GET \
  'http://localhost/Event-yetu/backend/api/ai.php?action=demand-forecast' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 4. Similar Services
```bash
curl -X GET \
  'http://localhost/Event-yetu/backend/api/ai.php?action=similar-services&service_id=1' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 5. Package Suggestions
```bash
curl -X GET \
  'http://localhost/Event-yetu/backend/api/ai.php?action=package-suggestions' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## 🎯 User Flow Examples

### Scenario 1: New User Discovery
```
1. New user logs in
2. Sees "For You" tab with popular services
3. Clicks trending service
4. Books the service
5. Returns to "For You" tab
6. Now sees personalized recommendations based on booking
```

### Scenario 2: Using Chat Assistant
```
1. User has questions about events
2. Clicks floating chat button
3. Asks "What are trending services?"
4. Gets instant list with booking counts
5. Asks "How much does photography cost?"
6. Gets detailed pricing breakdown
7. Asks "Give me planning tips"
8. Receives expert event planning advice
```

### Scenario 3: Provider Getting Insights
```
1. Provider logs in to dashboard
2. Checks analytics tab
3. (Future) Sees AI insights:
   - "Your Tents services have 85% confirmation rate"
   - "Catering demand up 40% this month"
   - "Your prices are competitive"
```

---

## 💡 Best Practices for Testing

### Generate Test Data
To see better recommendations:

1. **Create Multiple Bookings**
   - Book services from different categories
   - Book multiple services in same category
   - This trains the recommendation engine

2. **Different Time Periods**
   - Create bookings across different months
   - Helps test trend analysis

3. **Multiple Users**
   - Create several client accounts
   - Book different service types
   - See how recommendations personalize

### Chat Testing Tips
- Try variations of questions
- Mix keywords (e.g., "trending popular services")
- Ask follow-up questions
- Test quick action buttons

---

## 🐛 Troubleshooting

### Recommendations Not Showing
- **Check:** Do you have services in the database?
- **Fix:** Add some services via provider dashboard

### Chat Not Responding
- **Check:** Are you logged in?
- **Fix:** Ensure JWT token is valid (check localStorage)

### Empty Trending Section
- **Check:** Do you have recent bookings (last 30 days)?
- **Fix:** Create some test bookings

### API Returns 401
- **Check:** Is XAMPP/Apache running?
- **Check:** Is token included in request?
- **Fix:** Ensure backend is accessible at `http://localhost/Event-yetu/`

---

## 📱 Mobile Testing

All AI features are **fully responsive**:

1. **Chat Assistant**
   - Adapts to mobile screen width
   - Touch-friendly buttons
   - Smooth animations

2. **Recommendations**
   - Stacks to single column on mobile
   - Cards remain touch-friendly
   - Images scale properly

3. **Quick Actions**
   - Wrap on smaller screens
   - Easy to tap

---

## 🎨 Customization Ideas

### Customize Chat Responses
Edit `/frontend/src/components/ChatAssistant.jsx`:
- Modify `getBotResponse()` function
- Add new keyword triggers
- Change response templates

### Customize Recommendations
Edit `/backend/api/ai.php`:
- Adjust recommendation count (currently 6)
- Change trending period (currently 30 days)
- Modify sorting algorithms

### Add More Insights
In `getProviderInsights()`:
- Add seasonal predictions
- Add competitor analysis
- Add customer retention metrics

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ "For You" tab shows services
- ✅ Chat button appears and responds
- ✅ Personalized badge appears after bookings
- ✅ Trending section shows popular services
- ✅ API endpoints return JSON data
- ✅ No console errors in browser

---

## 🚀 Next: Production Deployment

When ready for production:

1. **Update API URLs** in frontend components:
   - ChatAssistant.jsx
   - SmartRecommendations.jsx
   - Change from `localhost` to your domain

2. **Optimize Database**:
   - Add indexes on frequently queried columns
   - Consider caching for AI endpoints

3. **Monitor Performance**:
   - Track API response times
   - Monitor recommendation click-through rates

4. **Gather Feedback**:
   - See which chat queries are most common
   - Track which recommendations get booked

---

## 🎉 You're All Set!

Your AI-enhanced Event Management System is ready to use. Start by exploring the "For You" tab and chatting with the assistant!

**Questions?** Check the main `AI_IMPLEMENTATION.md` for technical details.

**Happy event planning! 🎊**
