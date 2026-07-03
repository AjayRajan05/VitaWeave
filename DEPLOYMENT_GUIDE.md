# VitaWeave Production Deployment Guide

> **Canonical guide:** See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the up-to-date Supabase + EAS + Vercel deployment process aligned with this repository. This file is retained for extended EAS/platform notes.

## 🚀 Deployment Overview
This guide covers secure deployment of VitaWeave to production environments.

## 📋 Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] Production build configured
- [ ] Environment variables set
- [ ] Security audit completed
- [ ] Performance optimized

### 2. Infrastructure Ready
- [ ] Database backups configured
- [ ] SSL certificates obtained
- [ ] Monitoring tools set up
- [ ] Error tracking configured
- [ ] CDN for assets ready

## 🌐 Deployment Platforms

### Option 1: Expo Application Services (EAS)
**Recommended for most users**

#### Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure
```

#### Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "production"
      },
      "ios": {
        "appleId": "your-apple-id"
      }
    }
  }
}
```

#### Deploy Commands
```bash
# Build for development
eas build --platform android --profile development
eas build --platform ios --profile development

# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### Option 2: React Native CLI
**For custom deployment needs**

#### Android Deployment
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Generate App Bundle
./gradlew bundleRelease

# Upload to Google Play Console
# Upload: android/app/build/outputs/bundle/release/app-release.aab
```

#### iOS Deployment
```bash
# Install Xcode dependencies
cd ios
pod install

# Open in Xcode
open ios/VitaWeave.xcworkspace

# Archive and upload
# Product → Archive → Distribute App
```

### Option 3: Web Deployment
**For web-based deployment**

#### Build for Web
```bash
# Build web version
npx expo build:web

# Output in: dist/
```

#### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables in Vercel dashboard
# Add all .env variables to Vercel project settings
```

#### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## 🔒 Security Measures

### 1. API Security
```javascript
// Rate limiting implementation
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 2. Environment Security
```bash
# Production .env file security
chmod 600 .env
chown $USER:$USER .env

# Never commit .env to version control
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
```

### 3. Database Security
```sql
-- Enable row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "Users can only access their data" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

-- Audit logging
CREATE TABLE public.audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Network Security
```nginx
# Nginx configuration for security
server {
    # Hide server version
    server_tokens off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

## 📊 Monitoring & Analytics

### 1. Application Monitoring
```javascript
// Sentry integration for error tracking
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production',
  tracesSampleRate: 1.0,
});

// Performance monitoring
Sentry.startTransaction({
  name: 'patient-registration',
  op: 'navigation',
});
```

### 2. Database Monitoring
```sql
-- Query performance monitoring
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time
FROM pg_stat_statements 
WHERE calls > 100 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 3. API Monitoring
```javascript
// Custom monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log to monitoring service
    logMetrics({
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup EAS
        run: npm install -g eas-cli
      
      - name: Deploy to production
        run: |
          echo "${{ secrets.EXPO_TOKEN }}" | eas login --non-interactive
          eas build --platform android --profile production
          eas submit --platform android --profile production
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 🌍 Environment Configuration

### Production Environment Variables
```bash
# Required for production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_GEMINI_API_KEY=your-production-gemini-key
EXPO_PUBLIC_FIRECRAWL_API_KEY=your-production-firecrawl-key
EXPO_PUBLIC_AGORA_APP_ID=your-production-agora-id
EXPO_PUBLIC_AGORA_TOKEN=your-production-agora-token

# Production specific
NODE_ENV=production
API_BASE_URL=https://api.vitaweave.com
SENTRY_DSN=https://your-sentry-dsn
ANALYTICS_API_KEY=your-analytics-key
```

### Staging Environment
```bash
# Staging configuration
EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
NODE_ENV=staging
API_BASE_URL=https://staging-api.vitaweave.com
```

## 📱 App Store Deployment

### Google Play Store
1. **Prepare Assets**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (phone, 7" and 10" tablets)
   - Privacy policy URL
   - Target API level 33+

2. **Store Listing**
   - App name: "VitaWeave"
   - Short description: 80 characters
   - Full description: 4000 characters
   - Category: Medical
   - Content rating: Medical guidance

3. **Release Process**
   - Internal testing (1 week)
   - Closed testing (1 week)
   - Open testing (1 week)
   - Production release

### Apple App Store
1. **Prepare Assets**
   - App icon (1024x1024)
   - Screenshots (6.5", 5.5", 12.9", iPad)
   - App privacy policy
   - App review guidelines

2. **App Store Connect**
   - Create app record
   - Fill app metadata
   - Upload build
   - Submit for review

## 🔧 Performance Optimization

### 1. Bundle Size Optimization
```javascript
// Metro bundler configuration
module.exports = {
  resolver: {
    alias: {
      'react-native': 'react-native-web'
    }
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  optimizer: {
    enabled: true,
    config: {
      minify: true,
    },
  },
};
```

### 2. Image Optimization
```javascript
// Image compression and caching
import { Image } from 'react-native';

const OptimizedImage = ({ source, style }) => {
  return (
    <Image
      source={source}
      style={style}
      resizeMode="cover"
      cachePolicy="memory-disk"
      fadeDuration={0}
    />
  );
};
```

### 3. API Optimization
```javascript
// Request batching and caching
const batchRequests = async (requests) => {
  const batched = requests.map(req => 
    supabase.from(req.table).select(req.columns).eq(req.field, req.value)
  );
  
  const results = await Promise.all(batched);
  return results;
};
```

## 📋 Post-Deployment Checklist

### 1. Monitoring Setup
- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring active
- [ ] User analytics collecting
- [ ] Database query monitoring
- [ ] API response time tracking

### 2. Security Verification
- [ ] SSL certificates valid
- [ ] API endpoints secured
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Authentication flows tested

### 3. Functionality Testing
- [ ] User registration/login works
- [ ] Patient management functional
- [ ] AI responses working
- [ ] Video calling connects
- [ ] Image uploads successful
- [ ] Voice recognition active

### 4. Performance Validation
- [ ] App startup time < 3 seconds
- [ ] API responses < 2 seconds
- [ ] Video call quality acceptable
- [ ] Memory usage within limits
- [ ] Battery consumption reasonable

## 🚨 Rollback Plan

### Quick Rollback Procedure
```bash
# 1. Revert to previous version
git checkout previous-stable-tag

# 2. Hotfix deployment
npm run build:production
npm run deploy:emergency

# 3. Database rollback if needed
# Use Supabase point-in-time recovery
# Contact Supabase support for assistance
```

### Communication Plan
1. **Internal Team**: Immediate notification via Slack/Teams
2. **Stakeholders**: Email within 30 minutes
3. **Users**: In-app notification and email
4. **Support**: Updated troubleshooting guide

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Multiple app instances
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Increased database memory
- Enhanced CPU allocation
- Faster storage solutions

### Auto-scaling Setup
```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vitaweave-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vitaweave-api
  template:
    spec:
      containers:
      - name: api
        image: vitaweave:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 🎯 Production Success Metrics

### Key Performance Indicators
- **App Launch Time**: < 3 seconds
- **API Response Time**: < 2 seconds
- **Video Call Quality**: > 90% satisfaction
- **Error Rate**: < 1% of requests
- **User Retention**: > 80% after 30 days
- **App Store Rating**: > 4.0 stars

### Monitoring Alerts
```javascript
// Alert thresholds
const alerts = {
  errorRate: { threshold: 0.01, action: 'immediate' },
  responseTime: { threshold: 2000, action: 'warning' },
  videoQuality: { threshold: 0.8, action: 'investigate' },
  userComplaints: { threshold: 5, action: 'escalate' }
};
```

## 📞 Support & Maintenance

### 24/7 Monitoring
- System health dashboard
- Automated alert system
- On-call rotation schedule
- Emergency response procedures

### Regular Maintenance
- Weekly security updates
- Monthly performance reviews
- Quarterly feature audits
- Annual infrastructure assessment

Your VitaWeave application is now ready for production deployment with enterprise-grade security, monitoring, and scalability!
