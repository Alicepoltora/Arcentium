#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
#  push-to-github.sh
#  Пушит unified-balance-dashboard в https://github.com/Alicepoltora/Arcentium
#
#  Запуск:
#    cd <папка проекта>
#    chmod +x push-to-github.sh
#    ./push-to-github.sh
# ──────────────────────────────────────────────────────────────────────────────

set -e

REPO_URL="https://github.com/Alicepoltora/Arcentium.git"
BRANCH="main"

echo "🔧 Настраиваю git..."

# Добавляем все изменения
git add -A
git diff --staged --quiet || git commit -m "fix: replace @circle-fin/app-kit with viem for balance reading

- Remove non-existent @circle-fin/app-kit package
- Use viem createPublicClient + USDC balanceOf reads from public RPCs
- Add rpcUrl/usdcAddress/chainId to ChainConfig for all EVM testnets
- Replace EVM_PRIVATE_KEY with WALLET_ADDRESS (read-only, safer)
- Clean up next.config.mjs serverExternalPackages
- App still works in demo mode when WALLET_ADDRESS is not set"

# Убедимся что remote стоит правильно
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

echo "🌿 Переименовываю ветку в main..."
git branch -M "$BRANCH" 2>/dev/null || true

echo "🚀 Пушу в $REPO_URL..."
echo "   (GitHub попросит логин/пароль или Personal Access Token)"
echo ""
git push -u origin "$BRANCH" --force

echo ""
echo "✅ Готово! Код на GitHub: $REPO_URL"
echo ""
echo "🔜 Vercel подхватит изменения автоматически если репо уже подключено."
echo "   Если нет — иди на https://vercel.com/new и импортируй Alicepoltora/Arcentium"
echo ""
echo "📋 После деплоя добавь env переменную в Vercel (опционально):"
echo "   WALLET_ADDRESS=0xТвойАдрес"
echo "   (без этого — работает в demo-режиме с mock-данными)"
