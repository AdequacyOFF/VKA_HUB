#!/bin/bash
# Quick test script for template-based report generator

echo "🧪 Testing Template-Based Report Generator"
echo "=========================================="

# Check if backend is running
if ! docker ps | grep -q vkahub_backend; then
    echo "❌ Backend container not running!"
    echo "   Run: cd VKAHUB && docker-compose up -d backend"
    exit 1
fi

echo "✅ Backend container is running"

# Check if template exists
if ! docker exec vkahub_backend ls /app/raport_template.docx &>/dev/null; then
    echo "❌ Template file not found!"
    echo "   Copying template to container..."
    docker cp './Раопрт_хак_ВТБ_пример.docx' vkahub_backend:/app/raport_template.docx
    echo "✅ Template copied"
else
    echo "✅ Template file exists"
fi

echo ""
echo "📝 To test report generation:"
echo "   1. Open http://localhost:3000"
echo "   2. Login as moderator (GeDeKo / 1)"
echo "   3. Go to a competition with registered teams"
echo "   4. Click 'Сгенерировать рапорт' button"
echo "   5. Download the generated report"
echo ""
echo "🔍 To verify the generated report:"
echo "   ./VKAHUB/backend/verify_template_match.py \\"
echo "       ./Раопрт_хак_ВТБ_пример.docx \\"
echo "       ~/Downloads/raport_*.docx"
echo ""
echo "✅ Setup complete!"
