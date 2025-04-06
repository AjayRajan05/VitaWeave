# VitaWeave
Pragati AI for Impact|| Healthcare Domain

VitaWeave is a comprehensive healthcare platform designed to revolutionize rural healthcare delivery in India by empowering ASHA and ANM workers with AI-enhanced tools.

## 🌟 Overview

VitaWeave addresses critical healthcare challenges in rural India through four integrated components:

- **Digital Health Assistant**: AI-powered tools for ASHA/ANM workers
- **Maternal Monitoring System**: Wearable-based pregnancy tracking
- **Healthcare Benefits Navigator**: Government scheme access
- **MedRide**: Emergency medical transport system

## 🚀 Features

- Offline-capable mobile application with voice interface
- AI-assisted preliminary diagnosis and treatment suggestions
- Blockchain-secured patient records
- Real-time maternal health monitoring with wearables
- Multilingual healthcare information in local languages
- AI-driven government scheme eligibility assessment
- Emergency medical transport with optimized routing
- Hybrid edge-cloud architecture for low-connectivity areas

## 🛠️ Technology Stack

- **Frontend**: React Native
- **Backend**: Django with PostgreSQL
- **AI Components**: TensorFlow Lite, Edge Impulse
- **Voice Interface**: Mozilla DeepSpeech
- **Security**: Hyperledger Fabric
- **Conversational AI**: RASA
- **Federated Learning**: PySyft
- **Transport Routing**: OpenStreetMap with custom algorithms
- **Deployment**: Docker

## 📋 Prerequisites

- Node.js 16+
- React Native CLI
- Python 3.8+
- Docker & Docker Compose

## 🔧 Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/vitaweave.git
   cd vitaweave
   ```

2. Install React Native dependencies:
   ```
   npm install
   ```

3. Install pods (iOS):
   ```
   cd ios && pod install && cd ..
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` with your configuration values

## 🚀 Running the Application

### Development Mode

```bash
# Start Metro bundler
npx react-native start

# Run on Android
npx react-native run-android

# Run on iOS
npx react-native run-ios
```

### Using Docker

```bash
# Build and run all services
docker-compose up -d
```

## 📱 App Structure

```
vitaweave/
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/            # App screens
│   │   ├── HealthRecords/  # Digital records management
│   │   ├── Maternal/       # Maternal health monitoring
│   │   ├── Benefits/       # Healthcare scheme navigator
│   │   └── MedRide/        # Transport booking
│   ├── services/           # API services
│   ├── ai/                 # On-device AI models
│   └── utils/              # Helper functions
├── assets/                 # Static assets
└── backend/                # Django backend
```

## 🔒 Security Features

- End-to-end encryption for patient data
- Blockchain-based immutable audit trails
- Federated learning to protect patient privacy
- Role-based access controls

## 🌐 Offline Functionality

VitaWeave is designed to function in areas with limited connectivity:

- Core features work completely offline
- Data synchronization when connectivity is available
- Progressive data upload based on priority

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The dedicated ASHA and ANM workers who inspired this project
- [Pragati AI for Impact Hackathon 2025](https://vision.hack2skill.com/event/pragatiaiforimpact?utm_source=hack2skill&utm_medium=homepage)
- Open-source communities behind the technologies we use


