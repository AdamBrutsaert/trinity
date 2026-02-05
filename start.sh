#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Trinity - Démarrage complet     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo -e "${YELLOW}Ton IP locale : ${GREEN}${LOCAL_IP}${NC}"
echo -e "${YELLOW}Utilise cette IP dans ton app mobile !${NC}"
echo ""

if ! command -v bun &> /dev/null; then
    echo -e "${RED}Bun n'est pas installé${NC}"
    echo -e "${YELLOW}Pour installer Bun : curl -fsSL https://bun.sh/install | bash${NC}"
    exit 1
fi

cleanup() {
    echo ""
    echo -e "${YELLOW}Arrêt des services...${NC}"
    kill $API_PID $EXPO_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}Demarrage de PostgreSQL...${NC}"
docker compose up -d database
sleep 3

echo -e "${BLUE} Attendre le demarrage de l'API...${NC}"
cd apps/api
bun install > /dev/null 2>&1
bun run --watch src/index.ts &
API_PID=$!
cd ../..
sleep 2

echo -e "${GREEN}API démarrée sur http://${LOCAL_IP}:3000${NC}"
echo ""

echo -e "${BLUE}Démarrage d'Expo...${NC}"
cd mobile
npm install > /dev/null 2>&1

sed -i "s|http://localhost:3000|http://${LOCAL_IP}:3000|g" src/config/api.js

npx expo start &
EXPO_PID=$!
cd ..

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Tout est démarré !           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Pour tester sur ton téléphone :${NC}"
echo -e "   1. Installe 'Expo Go' depuis le Play Store/App Store"
echo -e "   2. Scanne le QR code qui apparaît dans le terminal"
echo -e "   3. Assure-toi d'être sur le même WiFi !"
echo ""
echo -e "${YELLOW}Pour tester sur le web :${NC}"
echo -e "   Appuie sur 'w' dans le terminal Expo"
echo ""
echo -e "${YELLOW}URL de l'API : ${GREEN}http://${LOCAL_IP}:3000${NC}"
echo ""
echo -e "${RED}Pour arrêter : Ctrl+C${NC}"
echo ""

wait
