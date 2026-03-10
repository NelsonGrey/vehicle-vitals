# Vehicle Vitals - Business Requirements & Strategic Analysis

**Version**: 1.1  
**Last Updated**: March 9, 2026  
**Status**: ⚠️ PARTIALLY OPERATIONAL (web core delivered, mobile/runtime parity in progress)  
**Owner**: Mark Nelson

---

## 📋 Executive Summary

**What**: Vehicle Vitals is a cross-platform vehicle management and maintenance tracking application enabling users to monitor vehicle health, track maintenance history, and receive proactive notifications.

**Why**: The automotive aftermarket maintenance services market is worth $300B+ globally. Vehicle owners struggle with:

- Forgotten maintenance schedules → expensive repairs
- Scattered maintenance records across multiple service centers
- No centralized view of vehicle status or upcoming maintenance needs
- Missed warranty claims due to untracked maintenance

**Market Opportunity**: Target the $12B+ vehicle maintenance tracking/management software market with a digital-first, user-friendly solution.

**Business Model**: Freemium with optional premium features (maintenance planning, advanced analytics, diagnostic integration).

**Current Status**: ⚠️ Web core is operational, but platform parity and several MVP-adjacent capabilities remain partial in current code paths (mobile services, reminder actions, and some integrations).

---

## Delivery Reality Snapshot (Code-Verified: March 9, 2026)

| Business-Critical Capability                             | Current Delivery State | Code Evidence                                                                                                                                  |
| -------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-platform user experience parity                    | 🟡 Partial             | Web implemented, mobile services mocked in `packages/mobile/lib/main.dart` and `packages/mobile/lib/services/*`                                |
| Proactive maintenance reminder operations                | 🔴 Incomplete          | Reminder lifecycle stubs in `packages/shared/src/firestoreServiceFactory.js`                                                                   |
| Notification execution (email/push)                      | 🟡 Partial             | Scheduler exists in `packages/functions/src/index.ts`; email integration still TODO; mobile push currently mock                                |
| Export/reporting for user value and compliance workflows | 🟡 Partial             | Web export exists in `packages/web/src/utils/dataExport.js`; mobile export disabled in `packages/mobile/lib/services/data_export_service.dart` |
| Fleet/provider/community roadmap features                | ⏸ Planned             | Not represented in current active web/mobile route surfaces                                                                                    |

Implication for business planning:

- Revenue and growth projections should assume a staged rollout profile rather than full cross-platform feature parity today.
- Positioning should emphasize delivered web value and transparent roadmap milestones for mobile/integration completion.

---

## 🔍 Market Analysis

### Total Addressable Market (TAM)

**Global Vehicle Population**: ~1.4 billion vehicles (cars, light trucks, motorcycles)

**Vehicle Owner Market Addressable**: 500M+ car owners in developed markets (US, EU, Japan, Canada, Australia, South Korea)

**TAM Calculation**:

- Direct: 500M vehicle owners × $20/year avg willingness to pay = **$10B TAM**
- Extended (maintenance apps, dealer services, insurance partners): **$50B+ TAM** when including B2B integrations

---

### Serviceable Addressable Market (SAM)

**Target Geography & Demographics**:

- North America: 250M adults
- Europe: 200M adults
- Australia, NZ, Japan: 100M adults
- Total: 550M addressable users

**Target Profile**: Age 25-65, owns/manages vehicles, urban/suburban (better app adoption), household income $40K+

**Serviceable Market**: 50-60M users in high-adoption markets

**SAM at $15 ARPU**: **$750M - $900M SAM**

---

### Serviceable Obtainable Market (SOM)

**Year 1 Target**: 100K active users (0.2% of SAM)

- 10K DAU × 10 monthly active ratio
- Revenue: 50K paying users × $15 ARPU = **$750K Year 1**

**Year 3 Target**: 1M active users (1.67% of SAM)

- 100K DAU × 10 monthly active ratio
- Revenue: 500K paying users × $15 ARPU = **$7.5M Year 3**

**Year 5 Target**: 5M active users (8.3% of SAM)

- 500K DAU × 10 monthly active ratio
- Revenue: 2.5M paying users × $15 ARPU = **$37.5M Year 5**

---

## 👥 User Personas

### Persona 1: "Responsible Vehicle Owner" (Primary - 60% of users)

**Demographics**:

- Age: 35-55
- Household Income: $60K-$150K
- Vehicle Count: 1-3 vehicles
- Tech Proficiency: Intermediate-Advanced
- Geography: Suburban, urban professionals

**Goals**:

- Maintain vehicle reliability and avoid unexpected breakdowns
- Track warranty status and maintain warranty compliance
- Plan major maintenance expenses
- Maximize vehicle resale value through documented maintenance
- Reduce time managing multiple vehicles

**Pain Points**:

- Loses maintenance receipts and records across dealers
- Forgets when next oil change or tire rotation is due
- Worried about warranty voidance if not maintaining correctly
- Difficulty comparing quotes from multiple mechanics
- Anxiety about vehicle reliability/breakdown risk

**Behaviors**:

- Uses smartphone 3-4 hours daily
- Manages household budget/spreadsheets
- Follows manufacturer maintenance schedules closely
- Seeks reliable information (manufacturer websites, trusted mechanics)
- Values convenience and time-saving

**Motivations for Vehicle Vitals**:

- Single source of truth for all vehicle records
- Automatic reminders prevent missed maintenance
- Peace of mind knowing exact maintenance status
- Better negotiation data with mechanics/dealers
- Proof of maintenance for resale value

---

### Persona 2: "Fleet Manager/Multi-Vehicle Owner" (Secondary - 25% of users)

**Demographics**:

- Age: 28-50
- Role: Small business owner, property manager, or manages family vehicles for elderly parents
- Vehicle Count: 3-10 vehicles
- Tech Proficiency: Advanced
- Geography: All markets

**Goals**:

- Efficiently manage maintenance across multiple vehicles
- Track costs and create budgets for fleet maintenance
- Ensure compliance with rental/commercial requirements
- Coordinate maintenance scheduling to minimize downtime
- Monitor driver behavior and vehicle health (fleet context)

**Pain Points**:

- Spreadsheet-based tracking is time-consuming and error-prone
- No visibility into real-time vehicle status across fleet
- Difficulty identifying cost-saving opportunities across vehicles
- Coordination challenges with multiple drivers/mechanics
- Compliance and documentation burden

**Behaviors**:

- Uses vehicle fleet management tools professionally
- Data-driven decision making
- Values integration with existing business systems
- Seeks efficiency and cost reduction
- Regular system monitoring

**Motivations for Vehicle Vitals**:

- Centralized view of all vehicles in one place
- Cost tracking and budgeting features
- Automated scheduling reduces administrative overhead
- Mobile access for real-time updates
- Integration with mechanic and service networks

---

### Persona 3: "Digitally-Native Young Driver" (Tertiary - 15% of users)

**Demographics**:

- Age: 18-35
- Household Income: $25K-$75K
- Vehicle Count: 1-2 vehicles (recently purchased)
- Tech Proficiency: Advanced (mobile-first)
- Geography: Urban centers, tech hubs

**Goals**:

- Maintain vehicle without complex dealer interactions
- Understand vehicle status through accessible interfaces
- Participate in online communities for maintenance advice
- Access peer reviews and recommendations for services
- Minimize time and effort managing vehicle admin

**Pain Points**:

- Complex vehicle terminology confuses them
- Intimidated by traditional mechanic interactions
- Wants peer recommendations, not just dealer advice
- Concerned about honest pricing from service centers
- Values sustainability and vehicle efficiency

**Behaviors**:

- Mobile-first, prefers apps to web/desktop
- Socially engaged, reads reviews before any service
- Price-conscious but values quality
- Uses voice/chat for support
- Motivated by gamification and social features

**Motivations for Vehicle Vitals**:

- Simple, intuitive mobile interface
- Clear explanations of what maintenance means/costs
- Community reviews and peer maintenance tips
- Price comparison tools to find best service centers
- Fun, modern design and experience

---

## 🎯 Business Objectives

### Strategic Business Objectives (SBOs)

#### SBO-1: Market Entry & User Acquisition

**Objective**: Establish Vehicle Vitals as the leading vehicle maintenance tracking solution

- **Target**: 100K DAU by end of Year 1, 1M DAU by Year 3
- **Timeline**: Year 1 (Month 1-12)
- **Key Metric**: Monthly Active Users (MAU), DAU/MAU cohort retention
- **Owner**: Mark Nelson (Product + Growth)
- **Priority**: 🔴 CRITICAL - Business viability dependent on user acquisition

**Success Criteria**:

- 10K DAU (Month 6), 50K DAU (Month 12)
- CAC (Customer Acquisition Cost) < $3 through organic + referral
- D30 retention ≥ 35%
- NPS (Net Promoter Score) ≥ 50

---

#### SBO-2: Revenue Generation & Monetization

**Objective**: Achieve sustainable revenue through freemium model + premium features

- **Target**: $750K revenue Year 1, $7.5M revenue Year 3
- **Timeline**: Year 1 (Month 6 onwards)
- **Key Metric**: Monthly Recurring Revenue (MRR), ARPU (Average Revenue Per User), Conversion Rate (free→paid)
- **Owner**: Mark Nelson (Growth + Finance)
- **Priority**: 🔴 CRITICAL - Business sustainability depends on revenue

**Success Criteria**:

- Premium conversion rate ≥ 5% (of free users)
- ARPU ≥ $15/month for paid subscribers
- Churn rate ≤ 2% monthly
- Lifetime Value (LTV) ≥ $100 per paying user

**Revenue Model**:

- Premium Subscription: $129/year ($10.75/month) - maintenance planning, advanced analytics, priority support
- Optional Add-ons: Dealer/mechanic network access ($49/year), Advanced diagnostics integration ($99/year)
- B2B: Fleet management module for business customers ($0.50-1.00 per vehicle/month)
- Partners: Insurance companies, maintenance providers (referral revenue)

---

#### SBO-3: Product-Market Fit & User Satisfaction

**Objective**: Achieve strong product-market fit with target users

- **Target**: NPS ≥ 50, feature adoption ≥ 70%, satisfaction ≥ 4.2/5.0
- **Timeline**: Ongoing (measurement starting Month 2)
- **Key Metric**: Net Promoter Score, Feature Adoption Rate, User Satisfaction Rating
- **Owner**: Mark Nelson (Product)
- **Priority**: 🔴 CRITICAL - Foundation for retention and growth

**Success Criteria**:

- Monthly in-app surveys show 70%+ feature awareness
- VIN scanning adoption ≥ 80% of new users
- Maintenance reminder notification engagement ≥ 60%
- Feature request backlog reflects user needs
- User retention (D90) ≥ 30%

---

#### SBO-4: Platform Expansion & Multi-Device Presence

**Objective**: Ensure seamless experience across web, iOS, Android, and browser extension

- **Target**: Feature parity across platforms, 70%+ users accessing multiple platforms
- **Timeline**: Year 1 (continuous)
- **Key Metric**: Platform usage distribution, Cross-platform user %, Feature parity coverage
- **Owner**: Engineering Team
- **Priority**: 🟡 HIGH - Required for market competitiveness

**Success Criteria**:

- Web, iOS, Android all at feature parity
- 60%+ of users access from 2+ platforms monthly
- Browser extension adoption ≥ 50K users by Month 12
- Sync latency < 5 seconds across platforms
- Zero critical bugs on any platform

---

#### SBO-5: Data & Intelligence Leadership

**Objective**: Build competitive advantage through analytics and vehicle intelligence

- **Target**: Predictive maintenance recommendations, fleet analytics dashboards
- **Timeline**: Year 1-2 phased rollout
- **Key Metric**: Prediction accuracy, Analytics dashboard adoption
- **Owner**: Data/Analytics Team
- **Priority**: 🟡 MEDIUM-HIGH - Enables SBO-2 (monetization) and SBO-3 (retention)

**Success Criteria**:

- Predictive maintenance alerts prevent 40% of unexpected breakdowns
- Fleet customers adoption of analytics ≥ 60%
- Data accuracy (maintenance records) ≥ 98%
- Integration with vehicle diagnostics systems (OBD-II) for 50%+ vehicles

---

#### SBO-6: Strategic Partnerships & Ecosystem

**Objective**: Build integrations with mechanics, dealerships, insurance providers, parts retailers

- **Target**: ≥ 250 partners, $2M+ partnership revenue
- **Timeline**: Year 1-2
- **Key Metric**: Active partner integrations, Partner referral revenue, Partner NPS
- **Owner**: Business Development
- **Priority**: 🟡 MEDIUM - Revenue multiplier and competitive moat

**Success Criteria**:

- Mechanic/dealership directory: 2,000+ locations with ratings/reviews
- Insurance partner integration: 5+ major providers offering discounts to VV users
- Parts/service retailer integrations: 10+ partners with affiliate tracking
- Partner satisfaction (NPS) ≥ 40

---

### Operational Objectives

#### OP-1: Infrastructure & DevOps Excellence

**Objective**: Maintain 99.9% uptime, sub-3s page load times

- **Target**: Uptime 99.95%, P95 latency < 3s, Error rate < 0.1%
- **Timeline**: Ongoing (baseline established Month 1)
- **Key Metric**: SLA compliance, Latency metrics, Error rates, Deployment frequency
- **Owner**: DevOps/Infrastructure Team
- **Priority**: 🔴 CRITICAL - Business blocking

**Success Criteria**:

- Monthly uptime ≥ 99.95%
- Page load time P95 < 2.5 seconds
- Database query latency P95 < 500ms
- Deployment success rate ≥ 98%
- MTTR (Mean Time to Recovery) ≤ 15 minutes

---

#### OP-2: Security & Privacy Compliance

**Objective**: Maintain industry-leading security and privacy standards

- **Target**: Zero data breaches, 100% GDPR/CCPA compliance, SOC 2 Type II certification
- **Timeline**: Ongoing (SOC 2 target: Month 8)
- **Key Metric**: Security incidents, Compliance audit results, Privacy score
- **Owner**: Security Team
- **Priority**: 🔴 CRITICAL - Regulatory and business risk

**Success Criteria**:

- Zero unauthorized data access incidents
- 100% GDPR/CCPA/COPPA compliance
- SOC 2 Type II certification achieved
- Annual penetration testing: zero critical findings
- User data encryption: AES-256 in transit + at rest
- Regular security training: 100% team completion

---

#### OP-3: Cost Optimization & Efficiency

**Objective**: Achieve unit economics that support scaling and profitability

- **Target**: COGS per user < $2/month, engineering efficiency ratio ≥ 0.5
- **Timeline**: Year 1-2
- **Key Metric**: Cost per user, Gross margin %, Engineering velocity, Infrastructure cost
- **Owner**: Finance + CTO
- **Priority**: 🟡 HIGH - Required for path to profitability

**Success Criteria**:

- Firebase, storage, compute costs < $2 per DAU monthly
- Gross margin (revenue - COGS) ≥ 70%
- Infrastructure cost scales <30% per 10x user growth
- CI/CD cost < $500/month for all platforms/environments

---

## 💰 Financial Projections

### Revenue Model Breakdown

| Channel             | Y1 Vol       | Y1 Revenue | Y3 Vol        | Y3 Revenue | Notes                            |
| ------------------- | ------------ | ---------- | ------------- | ---------- | -------------------------------- |
| **Free Users**      | 100K         | $0         | 1M            | $0         | Freemium base, engagement driver |
| **Premium Sub**     | 5K           | $645K      | 50K           | $6.45M     | $129/year, 5% conversion         |
| **Add-on Features** | 1K           | $75K       | 10K           | $750K      | Analytics + Dealer network       |
| **B2B Fleet**       | 50 customers | $30K       | 500 customers | $300K      | 50 vehicles avg × $12/year       |
| **TOTAL**           | —            | **$750K**  | —             | **$7.5M**  | —                                |

### Unit Economics

#### Cost Structure (per paying user, monthly)

- **COGS (Infrastructure + Platform fees)**: $1.50/user
  - Firebase: $0.80
  - Third-party APIs (VIN decode, etc.): $0.40
  - Payment processing: $0.20
  - Support/infrastructure: $0.10

- **CAC (Customer Acquisition Cost)**: $3.00
  - Organic/viral: $0 (majority)
  - ASO (App Store Optimization): $0.10 per install
  - Paid ads (YouTube, Facebook): $2.00 per acquisition (contingent on performance)

- **S&M (Sales & Marketing as % of revenue)**: 15-20%
- **R&D**: 25-30% of revenue
- **Operations/Overhead**: 15-20% of revenue

#### Payback Period & LTV

- **Average Revenue Per User (ARPU)**: $15/month for paid users
- **Customer Lifetime Value (LTV)**: $15/month × 24-month avg lifetime = **$360**
- **LTV:CAC Ratio**: $360 / $3 = **120:1** (excellent, indicates strong unit economics)
- **Payback Period**: 2.4 months (aggressive but achievable with high viral coefficient)

#### Profitability Path

- **Month 6**: MRR $62.5K, COGS $25K, Gross Margin $37.5K (60%)
- **Month 12**: MRR $1.875M annual / 12 = $156K monthly, Gross Margin ~$110K (70%)
- **Year 2**: Monthly run rate $300K+ MRR, approaching profitability (with efficient growth)
- **Year 3**: MRR $625K, Operating profitable at scale

---

## 📊 Key Performance Indicators (KPIs)

### Acquisition & Growth Metrics

| KPI                                 | Target Y1 M6 | Target Y1 M12 | Measurement            | Owner   |
| ----------------------------------- | ------------ | ------------- | ---------------------- | ------- |
| **Daily Active Users (DAU)**        | 10K          | 50K           | Firebase Analytics     | Growth  |
| **Monthly Active Users (MAU)**      | 60K          | 250K          | Firebase Analytics     | Growth  |
| **User Signups**                    | 5K/month     | 30K/month     | Auth logs              | Growth  |
| **App Store Rating**                | 4.5+ stars   | 4.6+ stars    | App Store + Play Store | Product |
| **App Downloads**                   | 500K         | 2M            | App Store + Play Store | Growth  |
| **Customer Acquisition Cost (CAC)** | <$2          | <$3           | Finance                | Growth  |
| **Viral Coefficient**               | 1.2x         | 1.5x+         | Referral tracking      | Growth  |

### Engagement & Retention Metrics

| KPI                      | Target Y1 M6 | Target Y1 M12 | Measurement      | Owner   |
| ------------------------ | ------------ | ------------- | ---------------- | ------- |
| **D7 Retention**         | 40%          | 45%           | Cohort analysis  | Product |
| **D30 Retention**        | 25%          | 35%           | Cohort analysis  | Product |
| **D90 Retention**        | 15%          | 25%           | Cohort analysis  | Product |
| **MAU/DAU Ratio**        | 6:1          | 5:1           | Engagement ratio | Product |
| **Avg Session Duration** | 4+ min       | 6+ min        | Analytics        | Product |
| **Daily Session Count**  | 1.2x         | 1.5x          | Analytics        | Product |

### Monetization & Revenue Metrics

| KPI                                 | Target Y1 M6 | Target Y1 M12 | Measurement     | Owner   |
| ----------------------------------- | ------------ | ------------- | --------------- | ------- |
| **Monthly Recurring Revenue (MRR)** | $62.5K       | $156K         | Stripe + custom | Finance |
| **Paid Users**                      | 4K           | 10K           | Stripe + custom | Finance |
| **Premium Conversion Rate**         | 3%           | 5%            | Analytics       | Growth  |
| **Average Revenue Per User (ARPU)** | $13/mo       | $15/mo        | Finance         | Finance |
| **Month-over-Month Growth (MoM)**   | 15%          | 10%           | Finance         | Finance |
| **Churn Rate**                      | <3%          | <2%           | Stripe          | Finance |
| **Lifetime Value (LTV)**            | $260         | $360          | Finance         | Finance |

### Product Quality & User Satisfaction

| KPI                                          | Target Y1 M6 | Target Y1 M12 | Measurement    | Owner       |
| -------------------------------------------- | ------------ | ------------- | -------------- | ----------- |
| **Net Promoter Score (NPS)**                 | 45+          | 50+           | In-app surveys | Product     |
| **Customer Satisfaction (CSAT)**             | 4+/5         | 4.2+/5        | In-app surveys | Support     |
| **Feature Adoption (VIN Scan)**              | 70%          | 80%           | Analytics      | Product     |
| **Feature Adoption (Maintenance Reminders)** | 60%          | 70%           | Analytics      | Product     |
| **Crash Rate**                               | <0.3%        | <0.2%         | Crashlytics    | Engineering |
| **Critical Bugs (Age >7d)**                  | 0            | 0             | Issue tracking | Engineering |
| **Page Load Time (P95)**                     | <2s          | <2.5s         | Analytics      | Engineering |
| **Successful VIN Decode Rate**               | 95%          | 98%           | Logs           | Product     |

---

## ⚠️ Risk Assessment & Mitigation

### Risk Matrix

| Risk                                                                               | Impact | Likelihood | Mitigation                                                                             | Owner         |
| ---------------------------------------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------- | ------------- |
| **Market saturation** from competitors (e.g., mileage-tracking apps pivoting)      | High   | Medium     | Differentiate via superior UX, B2B partnerships, first-mover advantage in premium tier | Product       |
| **Low user adoption** due to habit/inertia (most users never digitize records)     | High   | Medium     | Invest in onboarding, VIN scanning simplicity, referral incentives, partner push       | Growth        |
| **API deprecation risk** (VIN decode APIs changing)                                | Medium | Low        | Multi-source fallback, internal ML model development roadmap                           | Engineering   |
| **Privacy regulation changes** (GDPR, state auto-data laws)                        | Medium | Medium     | Legal review Q1, privacy-by-design architecture, compliance audit                      | Legal         |
| **Mechanic/dealership resistance** to sharing data                                 | Medium | Medium     | Positioning as consumer tool (not competitor), offer partnership benefits              | BD            |
| **iOS/Android policy changes** affecting freemium model                            | Medium | Low        | Monitor App Store policies quarterly, diversify revenue (web, B2B)                     | Product       |
| **Key personnel departure** during early growth                                    | Medium | Low        | Competitive comp, equity incentives, documentation/knowledge transfer                  | HR/Management |
| **Failure to achieve product-market fit**                                          | High   | Low        | Agile iteration, weekly user testing, pivot willingness                                | Product       |
| **Firebase cost escalation** at scale                                              | Medium | Low        | Cost monitoring, multi-cloud roadmap option, infrastructure optimization               | Finance       |
| **Integration failures** with third-party APIs (Apple CarPlay, Google integration) | Low    | Medium     | Fallback designs, internal alternatives, regular testing                               | Engineering   |

### Key Assumptions

1. **Market Assumption**: Target users will digitize vehicle maintenance records if solution is simple/free
2. **Technology Assumption**: VIN decode APIs remain available and accurate
3. **Growth Assumption**: Viral coefficient >1.0 achievable through referral incentives
4. **Business Assumption**: Premium conversion >3% achievable at $129/year price point
5. **Regulatory Assumption**: No major auto-data privacy laws blocking feature development

---

## 🎯 Go-to-Market Strategy

### Launch Phase (Month 1-3)

**Target Audience**: Early adopters, tech-forward vehicle owners, car maintenance enthusiasts

**Channels**:

1. **Organic**: Subreddits (r/cars, r/AutoDetailing, r/Cartalk), forums, tech blogs
2. **Influencer**: 20-50K followers in automotive/tech space (YouTube, TikTok)
3. **PR**: Press releases to automotive tech publications, "Best Apps" features
4. **Product Hunt**: Launch with active community engagement
5. **App Store Optimization (ASO)**: Targeted keywords (maintenance, vehicle tracker, car app)

**Message**: "Finally, a simple way to track your vehicle maintenance and never miss an important service"

**Target**: 50K users by end of Month 3

---

### Growth Phase (Month 4-12)

**Expanded Channels**:

1. **Partnerships**: Mechanic networks, dealership co-marketing, car manufacturers
2. **Paid**: YouTube pre-roll (automotive content), Facebook (35-55 age target), Google Ads
3. **Content Marketing**: SEO blog posts ("When to change transmission fluid", "Maintenance costs by vehicle")
4. **Referral Program**: $10 credit for referrer + referee
5. **Community Building**: Active user forums, success stories, maintenance tips

**Message Evolution**: From "track maintenance" → "never miss a service, save $2K/year on repairs"

**Target**: 250K users by end of Year 1

---

### Monetization Phase (Month 6+)

**Launch Premium Tier**:

- $129/year for maintenance planning + advanced analytics
- Positioned as "worth it" at $10-15/month for average user saving $200-300/year on repairs
- Free tier remains valuable for casual users

**B2B Outreach**:

- Fleet management module (property managers, delivery services, rental companies)
- Insurance partnerships (discount on premiums for tracked maintenance)
- Dealership tools (service reminder integration)

---

## 📋 Success Criteria & Decision Gates

### Phase 1: Market Development (Month 1-6)

**GO Criteria**:

- ✅ 10K DAU achieved (indicates product-market fit signal)
- ✅ D30 retention >25% (users actually using app long-term)
- ✅ NPS >45 (users willing to recommend)
- ✅ VIN scanning adoption >70% (core feature resonating)

**NO-GO Decision**: If any metric below threshold by Month 6 → pivot to B2B/fleet-only approach or shutdown

---

### Phase 2: Monetization Validation (Month 6-10)

**GO Criteria**:

- ✅ Premium conversion rate >2% (validates $129/year pricing)
- ✅ Churn rate <4% (free users aren't leaving due to premium upsell)
- ✅ MRR tracking toward $156K by Month 12
- ✅ CAC <$3 (unit economics work)

**NO-GO Decision**: If conversion <1% → consider different pricing, free→paid flow redesign, or pivot to ads-only model

---

### Phase 3: Profitability Path (Month 10-24)

**GO Criteria**:

- ✅ MRR >$100K (demonstrates revenue traction)
- ✅ Gross margin >60% (inherent business economics work)
- ✅ Path to profitability clear at 3-4x current burn rate
- ✅ LTV:CAC ratio >50:1

**NO-GO Decision**: If any criterion fails → reduce burn, consider acquisition by larger company, or wind down

---

## 🏛️ Regulatory & Compliance

### Data Privacy

- **GDPR** (EU users): User consent collection, data export, deletion mechanisms ✅ Implemented
- **CCPA** (California users): Privacy policy, non-discrimination in pricing ✅ Implemented
- **Privacy Policy**: Clear disclosure of data use, third-party sharing ✅ Published
- **Data Retention**: Vehicle records deleted on account deletion ✅ Implemented

### Automotive Regulations

- **Vehicle Data Access**: Independent access to vehicle data protected by NHTSA regulations
- **OBD-II Integration**: Compliance with EPA standards for vehicle diagnostic data
- **Insurance Integration**: Compliance with state insurance regulations for data sharing
- **Accessibility (WCAG 2.1 AA)**: 95% compliance target

### App Store Policies

- **Apple App Store**: Family Sharing compatible, privacy-focused data handling ✅ Approved
- **Google Play Store**: Target content rating: PEGI 3 / ESRB 3+ ✅ Approved

---

## 🔄 Roadmap Overview

### Phase 1: Foundation (Launched - Ongoing)

- ✅ Multi-platform (Web, iOS, Android)
- ✅ Core CRUD operations
- ✅ VIN scanning (barcode)
- ✅ Firebase backend + auth
- ✅ Maintenance tracking
- 🟡 Analytics dashboard (basic)

### Phase 2: Intelligence (Year 1-2)

- 🟡 Predictive maintenance alerts
- 🟡 Mechanic/dealership directory
- 🟡 Insurance partner integration
- 🟡 Cost predictive models
- 🟡 Maintenance schedule recommendations

### Phase 3: Ecosystem (Year 2-3)

- ⏸️ OBD-II connector integration
- ⏸️ Smart reminder scheduling
- ⏸️ Multi-driver fleet coordination
- ⏸️ Advanced diagnostics (partnership)
- ⏸️ AR vehicle inspection tools

---

## 📞 Stakeholder Requirements

### Engineering Team

| Requirement                                       | Why                                          |
| ------------------------------------------------- | -------------------------------------------- |
| Multi-platform build toolchain (Flutter + React)  | Efficiency, consistency, time-to-market      |
| Robust Firebase backend with offline-first design | Reliability, user experience offline         |
| Comprehensive test coverage (unit + integration)  | Quality assurance, confidence in deployments |
| CI/CD automation via GitHub Actions               | Speed, consistency, zero-touch deployments   |
| Monitoring & alerting (Sentry, Firebase)          | Incident response, user impact minimization  |

---

### Product Team

| Requirement                            | Why                                                      |
| -------------------------------------- | -------------------------------------------------------- |
| Weekly user interviews (5-10 users)    | Stay grounded in user needs, identify pivots early       |
| Quantitative analytics on all features | Data-driven decisions, remove guesswork                  |
| Feedback loop from support team        | Surface pain points before they become churning issues   |
| Competitive analysis quarterly         | Identify emerging threats, differentiation opportunities |
| Privacy-first feature design           | Risk mitigation, user trust                              |

---

### Growth Team

| Requirement                             | Why                                   |
| --------------------------------------- | ------------------------------------- |
| Referral incentive mechanics            | Leverage viral growth, lower CAC      |
| Social proof (user testimonials, press) | Reduce barrier to download/signup     |
| Cohort analysis by source               | Identify highest-quality user sources |
| Paid acquisition framework              | Sustainable, capital-efficient growth |
| Partnership development                 | B2B revenue, distribution leverage    |

---

## 📌 Key Decisions & Trade-offs

### Decision 1: Freemium vs. Subscription-Only

**Decision**: Freemium model with free core features + paid premium tier

- **Rationale**: Free tier lowers adoption barrier (critical for habit formation), premium tier monetizes engaged users
- **Trade-off**: Free tier requires ongoing support but drives viral coefficient

### Decision 2: Multi-Platform Launch

**Decision**: Launch Web + iOS + Android + Browser Extension simultaneously

- **Rationale**: Users expect seamless experience across devices, competitive necessity
- **Trade-off**: Higher engineering complexity, longer time to market, but better user retention

### Decision 3: B2B Fleet Module

**Decision**: Include fleet management within primary product

- **Rationale**: Fleet customers (property managers, delivery, car rental) have 5-10x higher LTV
- **Trade-off**: More complex UX, requires clear separation from consumer tier

### Decision 4: Self-Hosted Infrastructure (via Nelson-grey CI/CD)

**Decision**: Use Firebase + GitHub Actions for zero-touch automation

- **Rationale**: Reduces DevOps burden, enables rapid scaling, and supports reusable CI/CD operating patterns
- **Trade-off**: Firebase pricing scales with users; limited customization options

---

## ✅ Success Metrics & Review Cadence

**Monthly Reviews**: KPI dashboard update (growth, engagement, revenue metrics)
**Quarterly Reviews**: Strategic objective assessment, competitive landscape update
**Annual Reviews**: Full business plan update, market opportunity reassessment

---

## 📚 Appendix

### Market Research References

- McKinsey: Global automotive aftermarket analysis (2024)
- Statista: Vehicle population and ownership trends
- App Annie: Vehicle management app category analysis

### Competitive Landscape

- **CarCare**: Vehicle maintenance + community features (acquired 2023)
- **EveryDrive**: Insurance-integrated dashcam + maintenance (Series A funded)
- **Torque**: OBD-II scanner focus, DIY mechanics audience
- **Mechanic.com**: Repair cost estimator + finding mechanics
- **Vehicle Vitals Differentiation**: Simple UX + multi-platform + B2B capabilities

---

**Document Owner**: Mark Nelson  
**Next Review**: May 12, 2026  
**Version History**: 1.0 (Feb 12, 2026) - Initial creation
