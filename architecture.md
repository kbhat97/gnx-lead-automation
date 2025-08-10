# System Architecture

## Overview

The GNX Lead Automation System uses a **microservices architecture** designed for scalability, maintainability, and reliability. The system is built around three core components that work together to provide end-to-end lead processing.

## Architecture Diagram

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Form      │    │  n8n Workflows  │    │ Puppeteer API   │
│                 │    │                 │    │                 │
│ User Interface  │───▶│ Orchestration   │───▶│ Web Scraping    │
│ Lead Requests   │    │ Data Processing │    │ Site Analysis   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                       │                       │
│                       ▼                       │
│              ┌─────────────────┐              │
│              │  Google Sheets  │              │
└──────────────│                 │◀─────────────┘
│ Data Storage    │
│ Trigger Source  │
└─────────────────┘

## Component Details

### 1. **Web Form Interface**
- **Technology**: n8n Form Trigger
- **Purpose**: User-friendly interface for initiating lead generation
- **Inputs**: Business type, location, result limit
- **Output**: Triggers the lead generation workflow

### 2. **n8n Orchestration Layer**
- **Technology**: n8n workflow automation
- **Components**:
  - **Scraper Control Panel**: Handles form submissions and API calls
  - **Lead Processor**: Monitors new leads and initiates qualification
- **Design Pattern**: Event-driven architecture with sequential processing

### 3. **Puppeteer API Service**
- **Technology**: Node.js + Express + Puppeteer
- **Endpoints**:
  - `GET /scrape`: Google Maps lead generation
  - `GET /check-site`: WordPress detection
  - `GET /health`: Service health monitoring
- **Features**:
  - Containerized deployment
  - Error handling and timeouts
  - Browser automation with headless Chrome

### 4. **Data Layer**
- **Primary Storage**: Google Sheets (acts as database and trigger)
- **Metadata Storage**: PostgreSQL (for n8n workflow state)
- **Data Flow**: Form → API → Sheets → Trigger → Qualification → Update

## Design Decisions

### **Why Microservices?**
1. **Separation of Concerns**: Each service has a single responsibility
2. **Independent Scaling**: Services can be scaled based on demand
3. **Fault Isolation**: Failure in one service doesn't crash the system
4. **Technology Flexibility**: Each service can use optimal technology stack

### **Why n8n for Orchestration?**
1. **Visual Workflow Design**: Easy to understand and modify business logic
2. **Built-in Integrations**: Native Google Sheets, form triggers, HTTP requests
3. **Error Handling**: Automatic retries and error branches
4. **No-Code Friendly**: Non-technical users can modify workflows

### **Why Custom Puppeteer API?**
1. **Real Browser Automation**: Handles JavaScript-heavy modern websites
2. **Reliable Scraping**: Better success rate than simple HTTP requests
3. **Flexible Analysis**: Can analyze page content, DOM structure, network requests
4. **Containerization**: Consistent deployment across environments

### **Why Google Sheets as Database?**
1. **Built-in Triggers**: Automatic workflow triggers on data changes
2. **User-Friendly**: Business users can view/edit data directly
3. **Real-time Collaboration**: Multiple users can monitor results
4. **No Database Management**: No need for complex database setup

## Data Flow

### **Phase 1: Lead Generation**
User Form Input → n8n Form Trigger → HTTP Request to /scrape →
Puppeteer API → Google Maps Scraping → Return JSON →
n8n Google Sheets Node → Append to Sheet

### **Phase 2: Lead Qualification**
New Row in Sheet → Google Sheets Trigger → n8n Lead Processor →
Split into Individual Leads → Check if Website Exists →
HTTP Request to /check-site → Puppeteer WordPress Detection →
Merge Results → Update Sheet with Yes/No

## Safety & Reliability Features

### **Error Handling**
- **API Timeouts**: 45-second timeout for website analysis
- **Graceful Degradation**: Continue processing even if some sites fail
- **Retry Logic**: Built-in n8n retry mechanisms
- **Error Logging**: Comprehensive logging for debugging

### **Rate Limiting**
- **Sequential Processing**: One lead at a time to prevent overload
- **Delays**: Built-in delays between Google Maps interactions
- **Health Checks**: Docker health monitoring for all services

### **Data Validation**
- **Input Sanitization**: Validate form inputs and URLs
- **Schema Enforcement**: Consistent data structure across workflows
- **Duplicate Prevention**: Business name matching for updates

## Scalability Considerations

### **Current Scale**
- **Processing Speed**: ~30 seconds per lead qualification
- **Concurrent Capacity**: Designed for single-user operation
- **Data Volume**: Tested with 100+ leads per session

### **Scaling Strategies**
1. **Horizontal Scaling**: Multiple Puppeteer API instances
2. **Parallel Processing**: Modify n8n workflows for concurrent processing
3. **Caching**: Add Redis for frequently accessed data
4. **Load Balancing**: Nginx for API request distribution

## Security Considerations

- **No Sensitive Data Storage**: No API keys or credentials in containers
- **Environment Variables**: Secure configuration management
- **Network Isolation**: Services communicate via Docker network
- **Access Control**: Google Sheets permissions control data access

## Future Enhancements

1. **Machine Learning Integration**: Lead scoring based on historical conversion
2. **Advanced Qualification**: Technology stack analysis beyond WordPress
3. **Real-time Dashboard**: Live monitoring and analytics
4. **Multi-platform Integration**: LinkedIn, Yelp, industry-specific directories
