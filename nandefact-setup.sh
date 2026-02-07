#!/bin/bash
#==============================================================================
# ÑandeFact - Setup Script v2
# - Si algo falla, sigue con el siguiente paso
# - Muestra resumen final con exitosos, warnings y fallos
# Ejecutar: chmod +x nandefact-setup.sh && ./nandefact-setup.sh
#==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=()
FAILED=()
WARNINGS=()

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error(){ echo -e "${RED}[✗]${NC} $1"; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

run_step() {
    local name="$1"
    local func="$2"
    step "$name"
    if $func; then
        PASSED+=("$name")
        log "$name — OK"
    else
        FAILED+=("$name")
        error "$name — FALLÓ (continuando con el siguiente...)"
    fi
}

#----------------------------------------------
# FUNCIONES
#----------------------------------------------

install_system_deps() {
    sudo apt update -y > /dev/null 2>&1
    sudo apt install -y curl git zip unzip build-essential > /dev/null 2>&1
}

install_node22() {
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

    if ! command -v nvm &> /dev/null; then
        log "Instalando nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh 2>/dev/null | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    fi

    command -v nvm &> /dev/null || return 1

    CURRENT_NODE=$(node -v 2>/dev/null || echo "none")
    if [[ "$CURRENT_NODE" != v22* ]]; then
        nvm install 22 && nvm use 22 && nvm alias default 22
    else
        log "Ya instalado: $CURRENT_NODE"
    fi

    node -v 2>/dev/null | grep -q "v22" || return 1
}

configure_npm() {
    mkdir -p ~/.npm-global
    npm config set prefix ~/.npm-global

    if ! grep -q 'npm-global/bin' ~/.bashrc; then
        echo '' >> ~/.bashrc
        echo '# npm global bin' >> ~/.bashrc
        echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
    fi
    export PATH="$HOME/.npm-global/bin:$PATH"
    npm -v > /dev/null 2>&1 || return 1
}

install_claude_code() {
    npm install -g @anthropic-ai/claude-code 2>&1 | tail -3
    export PATH="$HOME/.npm-global/bin:$PATH"

    if command -v claude &> /dev/null; then
        log "Versión: $(claude --version 2>/dev/null)"
        return 0
    elif [ -f "$HOME/.npm-global/bin/claude" ]; then
        log "Instalado en ~/.npm-global/bin/claude"
        return 0
    fi
    return 1
}

install_gsd() {
    npm install -g @anthropic-ai/claude-code-gsd 2>/dev/null
    if ! command -v gsd &> /dev/null; then
        WARNINGS+=("GSD: paquete npm no encontrado, se usa desde Claude Code directamente")
    fi
    return 0
}

install_find_skills() {
    npm install -g find-skills 2>/dev/null
    if ! command -v find-skills &> /dev/null; then
        WARNINGS+=("find-skills: no disponible en npm, instalar manualmente después")
    fi
    return 0
}

create_skill_directories() {
    mkdir -p ~/.claude/skills ~/.claude/commands
    [ -d ~/.claude/skills ] && [ -d ~/.claude/commands ] || return 1
}

install_worktree_workflow() {
    local TMP="/tmp/worktree-workflow-$$"
    rm -rf "$TMP"

    if git clone --depth 1 https://github.com/anthropics/worktree-workflow.git "$TMP" 2>/dev/null ||
       git clone --depth 1 https://github.com/forrestchang/worktree-workflow.git "$TMP" 2>/dev/null; then
        cp -r "$TMP/skills/"* ~/.claude/skills/ 2>/dev/null || true
        cp -r "$TMP/commands/"* ~/.claude/commands/ 2>/dev/null || true
        rm -rf "$TMP"
    else
        WARNINGS+=("worktree-workflow: repo no disponible, skill básica creada en su lugar")
        mkdir -p ~/.claude/skills/worktree
        cat > ~/.claude/skills/worktree/SKILL.md << 'EOF'
---
name: worktree
description: Manage git worktrees for parallel development.
---
# Git Worktree
Use `git worktree add ../feature-name feature-branch` for isolated working directories.
EOF
    fi
    return 0
}

create_skill_git_workflow() {
    mkdir -p ~/.claude/skills/git-workflow
    cat > ~/.claude/skills/git-workflow/SKILL.md << 'SKILL'
---
name: git-workflow
description: Git workflow con ramas para desarrollo seguro. Usar SIEMPRE antes de empezar una feature, fix, o refactor. Nunca commitear directo a main.
---
# Git Workflow - ÑandeFact

## REGLA PRINCIPAL
NUNCA commitear directo a `main`. Todo desarrollo en ramas.

## Antes de empezar cualquier tarea:
```bash
git checkout main && git pull origin main
git checkout -b <tipo>/<nombre-descriptivo>
```

## Tipos de rama:
- `feat/` — Features nuevas
- `fix/` — Bugfixes
- `refactor/` — Refactors
- `test/` — Tests
- `docs/` — Documentación
- `chore/` — Mantenimiento

## Conventional Commits (español):
- `feat: agregar value object CDC con validación módulo 11`
- `fix: corregir cálculo IVA 5% en MontoIVA`
- `test: agregar tests unitarios para agregado Factura`

## Merge a main:
1. Tests pasan → `git diff main` → `git checkout main && git merge <rama>` → `git push`

## Si algo sale mal:
- `git checkout main` y descartar rama: `git branch -D <rama-rota>`
SKILL

    [ -f ~/.claude/skills/git-workflow/SKILL.md ] || return 1
}

create_skill_hexagonal() {
    mkdir -p ~/.claude/skills/hexagonal-architecture
    cat > ~/.claude/skills/hexagonal-architecture/SKILL.md << 'SKILL'
---
name: hexagonal-architecture
description: Arquitectura hexagonal (puertos y adaptadores) para ÑandeFact. Usar cuando se creen entidades, casos de uso, repositorios, o adaptadores. Dependencias siempre hacia adentro.
---
# Arquitectura Hexagonal - ÑandeFact

## Regla de dependencias
Infrastructure → Application → Domain (SIEMPRE hacia adentro)
Domain NUNCA importa de capas externas.

## Capas:
- **Domain**: Entidades, VOs, Agregados, Puertos (interfaces), Excepciones. SIN deps externas.
- **Application**: Casos de uso. Usa puertos, NO implementaciones. Inyección de dependencias.
- **Infrastructure**: Implementa puertos. PostgreSQL, SIFEN SOAP, WhatsApp, PDF.
- **Interfaces**: API REST. Routes, middleware, validación Zod.

## Estructura:
```
src/
├── domain/
├── application/
├── infrastructure/
└── interfaces/
```

## Tests:
- Domain: unit tests puros
- Application: mocks de puertos
- Infrastructure: integration con DB
- Interfaces: e2e con supertest
SKILL

    [ -f ~/.claude/skills/hexagonal-architecture/SKILL.md ] || return 1
}

create_skill_sifen() {
    mkdir -p ~/.claude/skills/sifen-rules
    cat > ~/.claude/skills/sifen-rules/SKILL.md << 'SKILL'
---
name: sifen-rules
description: Reglas de SIFEN Paraguay para facturación electrónica. Usar cuando se trabaje con CDC, XML, IVA, firma digital, KuDE, o cualquier integración SIFEN.
---
# Reglas SIFEN - ÑandeFact

## CDC (44 dígitos):
- [2 tipo][8 RUC][1 DV RUC][3 estab][3 punto][7 num][1 tipo contrib][8 fecha][1 tipo emisión][9 código seg][1 DV CDC]
- DV: módulo 11, factores 2-9 cíclicos derecha-izquierda

## IVA Paraguay (precios INCLUYEN IVA):
- 10%: base = total / 1.10
- 5%: base = total / 1.05
- Exenta: base = 0
- PYG SIN decimales

## XML: UTF-8, sin prefijos namespace, fechas YYYY-MM-DDThh:mm:ss
## Firma: RSA 2048 + SHA-256 + XMLDSig Enveloped. CCFE nunca en texto plano.

## Respuestas: 0260=OK, 0261=OK+obs, 0300-0399=rechazado, 0360=async

## Libs TIPS-SA (npm):
- facturacionelectronicapy-xmlgen/xmlsign/setapi/qrgen/kude
SKILL

    [ -f ~/.claude/skills/sifen-rules/SKILL.md ] || return 1
}

verify_docker() {
    if command -v docker &> /dev/null; then
        log "Docker: $(docker --version 2>/dev/null)"
    else
        WARNINGS+=("Docker no detectado. Abrir Docker Desktop → Settings → WSL Integration → Enable Ubuntu")
    fi
    return 0
}

#----------------------------------------------
# EJECUCIÓN
#----------------------------------------------

echo ""
echo "========================================="
echo "  ÑandeFact - Setup v2"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

START=$(date +%s)

run_step "1. Dependencias del sistema"        install_system_deps
run_step "2. Node.js 22 (nvm)"               install_node22
run_step "3. npm global config"               configure_npm
run_step "4. Claude Code"                     install_claude_code
run_step "5. GSD"                             install_gsd
run_step "6. find-skills"                     install_find_skills
run_step "7. Directorios de skills"           create_skill_directories
run_step "8. Worktree Workflow"               install_worktree_workflow
run_step "9. Skill: Git Workflow"             create_skill_git_workflow
run_step "10. Skill: Arquitectura Hexagonal"  create_skill_hexagonal
run_step "11. Skill: Reglas SIFEN"            create_skill_sifen
run_step "12. Docker"                         verify_docker

END=$(date +%s)
ELAPSED=$((END - START))

#----------------------------------------------
# RESUMEN FINAL
#----------------------------------------------

echo ""
echo "╔═════════════════════════════════════════╗"
echo "║     RESUMEN — ${ELAPSED}s                       ║"
echo "╚═════════════════════════════════════════╝"

echo ""
echo -e "${CYAN}Versiones:${NC}"
echo -n "  Node.js:      " && (node -v 2>/dev/null || echo "NO")
echo -n "  npm:          " && (npm -v 2>/dev/null || echo "NO")
echo -n "  Claude Code:  " && (claude --version 2>/dev/null || echo "NO")
echo -n "  git:          " && (git --version 2>/dev/null | cut -d' ' -f3 || echo "NO")
echo -n "  gh:           " && (gh --version 2>/dev/null | head -1 | cut -d' ' -f3 || echo "NO")
echo -n "  Docker:       " && (docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo "NO")

echo ""
echo -e "${CYAN}Skills:${NC}"
for d in ~/.claude/skills/*/; do
    [ -f "$d/SKILL.md" ] && echo -e "  ${GREEN}✓${NC} $(basename $d)"
done

echo ""
echo -e "${GREEN}✓ EXITOSOS (${#PASSED[@]}):${NC}"
for item in "${PASSED[@]}"; do echo -e "  ${GREEN}✓${NC} $item"; done

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}! ADVERTENCIAS (${#WARNINGS[@]}):${NC}"
    for item in "${WARNINGS[@]}"; do echo -e "  ${YELLOW}!${NC} $item"; done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}✗ FALLARON (${#FAILED[@]}):${NC}"
    for item in "${FAILED[@]}"; do echo -e "  ${RED}✗${NC} $item"; done
fi

echo ""
echo "─────────────────────────────────────────"
TOTAL=$((${#PASSED[@]} + ${#FAILED[@]}))
echo -e "  ${GREEN}OK: ${#PASSED[@]}${NC} | ${YELLOW}Warn: ${#WARNINGS[@]}${NC} | ${RED}Fail: ${#FAILED[@]}${NC} | Total: $TOTAL"
echo "─────────────────────────────────────────"

if [ ${#FAILED[@]} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Todo instalado!${NC}"
else
    echo -e "\n${YELLOW}⚠️  ${#FAILED[@]} error(es). Revisar arriba.${NC}"
fi

echo ""
echo "Próximos pasos:"
echo "  1. Cerrar y reabrir terminal"
echo "  2. cd ~/projects/nandefact"
echo "  3. claude"
echo "  4. Autenticar con Claude Max"
echo ""
