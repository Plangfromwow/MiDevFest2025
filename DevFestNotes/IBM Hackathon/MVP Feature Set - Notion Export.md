---
Date: 2025-11-22
Note Type:
---
#notes 
 

Here’s a **final, hackathon-tight feature set** + **exactly what to use where** with your stack (React, Python, IBM watsonx, Google APIs). I’m scoping this to something you can demo strongly in 1 day, with a couple stretch items if you finish early.

---

## **Final Feature Set (MVP + Stretch)**

### **MVP Pillar 1:**

### **Reputation Copilot (Reviews → Action)**

1. **Review Pull + Unified Feed**
    - Pull new reviews **from Google Business Profile**.
    - Show all reviews in one timeline with source badges.
    - Why Google first: Google’s Business Profile APIs support listing reviews and replying to them.
2. **AI Review Triage**
    - For every new review, AI outputs:
        - sentiment (pos/neu/neg)
        - severity (low/med/high)
        - themes (e.g., “late delivery,” “staff behavior”)
        - recommended public reply
        - original content (Message/Pictures)
        - “auto-reply OK?” boolean
    - Use **structured JSON output** so your UI can render clean cards. Granite function calling is made for this.
    - database for storing comments and recommend reply
3. **Auto-Reply Queue + Owner Escalation**
    - **Low/medium severity →** goes to “Auto-Reply Queue” (owner can one-tap approve/post).
    - **High severity →** “Escalate to owner” card with:
        - why it’s severe
        - suggested action (refund, callback, etc.)
        - draft private outreach message.
4. **Weekly Insight Strip**
    - “Top 3 complaint themes this week”
    - “Rating risk score”
    - “1 quick fix to improve reviews”

---

### **MVP Pillar 2:**

### **Demand Copilot (Trends → Inventory/Promo)**

1. **SKU Upload**
    - Owner uploads a simple SKU/name list (CSV) + optional last-month sales CSV.
2. **Local Demand Brief**
    - AI creates a 7-day brief:
        - top SKUs likely to spike
        - likely sellouts
        - suggested reorder deltas (+15%, +30%)
        - 2 promo ideas tied to upcoming conditions
    - You can drive this with lightweight signals (weather + simple seasonality + sales). AI turns it into business actions.

---

### **Cross-Cutting MVP:**

### **“Ask My Business” Chat**

1. **Owner Chat**
    - One chat tab where owner asks:
        - “Summarize bad reviews today.”
        - “What should I reorder for the weekend?”
        - “Draft a reply to this 1-star review.”
    - This is your adoption hook: owners don’t want dashboards; they want answers.

---

### **Stretch (only if MVP done)**

1. **Yelp / Other Sources Import**
    - Yelp API gives **only up to 3 short excerpts**, not full text.
    - So include Yelp as:
        - “Excerpt mode” OR
        - manual paste/upload import.
    - Add another import slot (FB/IG, DoorDash, etc.) via CSV/paste.
2. **Voice Inbox (not phone dialing)**
    - Owner records a voice note:
        
        “Tell me today’s risks and opportunities.”
        
    - App returns audio/text summary.
        
    - Keeps scope tight vs building a telephony product.
        

---

## **What to use for what (your stack)**

### **React (Frontend)**

Build the whole “MainStreet Command Center” UI:

- **Reputation tab**
    - review feed
    - severity color chips
    - approve/escalate buttons
- **Demand tab**
    - SKU upload
    - 7-day demand cards
- **Ask tab**
    - chat UI
    - quick-action chips
- Optional: map/heat UI if you want extra wow.

React is purely presentation + calling your backend APIs.

---

### **Python (Backend / Orchestration)**

Use Python as the “business brain” because it’s fastest for hackathon AI glue:

**Services**

1. **Ingestion service**
    - fetch Google reviews on a schedule / on refresh
    - store raw reviews
2. **AI analysis service**
    - call [watsonx.ai](http://watsonx.ai) to triage reviews (JSON output)
    - call [watsonx.ai](http://watsonx.ai) to generate demand brief (JSON output)
    - validate JSON → store insights
3. **Simple forecasting / signals**
    - moving average or day-of-week uplift from sales CSV
    - optional weather pull

You can do this cleanly with FastAPI + SQLite/Postgres.

---

### **IBM [watsonx.ai](http://watsonx.ai) (Foundation model engine)**

Use **Granite Instruct** for:

- **Review triage → structured JSON**
    
- **Reply drafting**
    
- **Theme clustering**
    
- **Demand brief & promo recommendations → structured JSON**
    
    Granite supports reliable tool/function-calling style outputs you can schema-lock.
    

---

### **IBM watsonx Assistant (Conversational layer)**

Use Assistant for:

- the **Ask My Business chat**
- calling your Python endpoints via **custom extension/OpenAPI actions**
- optional voice channel if you enable it

Assistant = friendly front door.

[watsonx.ai](http://watsonx.ai) = reasoning + generation.

---

### **Google APIs**

**Google Business Profile (My Business) Reviews API**

- list reviews for locations
    
- post replies to reviews
    
- refresh new ones
    
    This is your one **live, real** data source in the demo.
    
- (Don’t touch the Q&A API; it’s being discontinued Nov 3, 2025, anyway.)
    

---

## **Ultra-simple architecture (how it flows)**

1. **React UI** → calls Python backend
2. **Python backend**
    - pulls Google reviews
    - stores them
    - sends each new review to [watsonx.ai](http://watsonx.ai)
3. **[watsonx.ai](http://watsonx.ai)**
    - returns triage JSON + reply draft
4. **Backend** → updates UI cards
5. **Owner approves** → backend posts reply via Google API
6. **Demand Copilot**
    - SKU + sales upload → backend → [watsonx.ai](http://watsonx.ai) brief JSON → UI
7. **Ask tab**
    - watsonx Assistant calls backend actions → shows answers

---

If you want, I’ll write the exact [watsonx.ai](http://watsonx.ai) prompts + JSON schemas for:

- **review triage + reply generator**
    
- **demand brief generator**
    
    so you can plug them straight into your Python service.