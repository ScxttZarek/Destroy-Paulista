// ==UserScript==
// @name         Sala do Futuro - Assistente de Respostas
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Revela respostas corretas e oferece opções de ajuda
// @match        *://saladofuturo.se.df.gov.br/*
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    
    // Configurações do usuário (pode modificar)
    const config = {
        highlightColor: '#e6ffed',
        borderColor: '#2ecc71',
        badgeText: '✓',
        autoRun: false,
        showButton: true
    };
    
    // Estilos customizados
    GM_addStyle(`
        .resposta-certa-dsf {
            background-color: ${config.highlightColor} !important;
            border-left: 4px solid ${config.borderColor} !important;
            padding: 8px 12px !important;
            border-radius: 4px !important;
            animation: pulse-dsf 2s infinite;
            margin: 5px 0;
            position: relative;
        }
        @keyframes pulse-dsf {
            0% { background-color: ${config.highlightColor}; }
            50% { background-color: #c8e6d1; }
            100% { background-color: ${config.highlightColor}; }
        }
        .badge-resposta-dsf {
            display: inline-block;
            background: ${config.borderColor};
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
            font-weight: bold;
        }
        .container-botoes-dsf {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .botao-dsf {
            padding: 10px 15px;
            background: ${config.borderColor};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-weight: bold;
            transition: all 0.3s;
            min-width: 180px;
            text-align: center;
        }
        .botao-dsf:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .botao-dsf:active {
            transform: translateY(0);
        }
        .botao-dsf.secundario {
            background: #3498db;
        }
        .botao-dsf.aviso {
            background: #e74c3c;
        }
        .tooltip-dsf {
            visibility: hidden;
            width: 200px;
            background-color: #555;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .botao-dsf:hover .tooltip-dsf {
            visibility: visible;
            opacity: 1;
        }
    `);
    
    // Função principal para encontrar respostas
    function encontrarRespostas() {
        let encontradas = false;
        const methods = [
            // Método 1: Inputs com atributos de resposta correta
            () => {
                const selectors = [
                    'input[data-correct="true"]',
                    'input.correct-answer',
                    'input[value="true"]',
                    'input.checked'
                ];
                return processarElementos(selectors, 'input');
            },
            
            // Método 2: Elementos com texto indicativo
            () => {
                const elements = document.querySelectorAll('.answer-text, .resposta-item, .alternative, .question-option');
                elements.forEach(el => {
                    const texto = el.textContent.toLowerCase();
                    const indicadores = ['(correta)', 'resposta certa', 'alternativa correta', 'gabarito:'];
                    if (indicadores.some(i => texto.includes(i))) {
                        marcarResposta(el);
                        encontradas = true;
                    }
                });
                return encontradas;
            },
            
            // Método 3: Classes comuns de respostas corretas
            () => {
                const classes = ['correct', 'right-answer', 'is-correct', 'true-answer', 'resposta-correta'];
                return processarElementos(classes.map(c => `.${c}`), 'class');
            },
            
            // Método 4: Comparação com gabarito (se visível)
            () => {
                const gabarito = document.querySelector('.gabarito, .feedback, .answer-key');
                if (gabarito) {
                    const respostas = gabarito.textContent.match(/[A-Ea-e1-5]/g);
                    if (respostas) {
                        document.querySelectorAll('.question').forEach((q, i) => {
                            if (respostas[i]) {
                                const opcao = q.querySelector(`[data-option="${respostas[i]}"], .option-${respostas[i]}`);
                                if (opcao) marcarResposta(opcao);
                            }
                        });
                        return true;
                    }
                }
                return false;
            }
        ];
        
        // Executa todos os métodos até encontrar respostas
        for (const method of methods) {
            if (method()) {
                encontradas = true;
                break;
            }
        }
        
        return encontradas;
    }
    
    // Função auxiliar para processar elementos
    function processarElementos(selectors, type) {
        let encontradas = false;
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                let target = el;
                if (type === 'input') {
                    target = el.closest('label') || document.querySelector(`label[for="${el.id}"]`) || el.parentElement;
                }
                if (target) {
                    marcarResposta(target);
                    encontradas = true;
                }
            });
        });
        return encontradas;
    }
    
    // Função para marcar uma resposta como correta
    function marcarResposta(element) {
        if (!element.classList.contains('resposta-certa-dsf')) {
            element.classList.add('resposta-certa-dsf');
            const badge = document.createElement('span');
            badge.className = 'badge-resposta-dsf';
            badge.textContent = config.badgeText;
            element.appendChild(badge);
        }
    }
    
    // Função para criar a interface
    function criarInterface() {
        const container = document.createElement('div');
        container.className = 'container-botoes-dsf';
        
        // Botão principal
        const btnRevelar = document.createElement('button');
        btnRevelar.className = 'botao-dsf';
        btnRevelar.innerHTML = '🔍 Revelar Respostas <span class="tooltip-dsf">Mostra as respostas corretas sem enviar automaticamente</span>';
        btnRevelar.onclick = function() {
            const sucesso = encontrarRespostas();
            if (sucesso) {
                btnRevelar.innerHTML = '✅ Respostas Encontradas <span class="tooltip-dsf">As respostas corretas estão destacadas em verde</span>';
                btnRevelar.style.background = '#27ae60';
                GM_notification({
                    title: 'Sala do Futuro - Respostas Encontradas',
                    text: 'As respostas corretas foram destacadas na página.',
                    timeout: 3000
                });
            } else {
                btnRevelar.innerHTML = '❌ Não Encontrado <span class="tooltip-dsf">Não foi possível identificar as respostas automaticamente</span>';
                btnRevelar.style.background = '#e74c3c';
                setTimeout(() => {
                    btnRevelar.innerHTML = '🔍 Revelar Respostas <span class="tooltip-dsf">Tente novamente após carregar todas as questões</span>';
                    btnRevelar.style.background = config.borderColor;
                }, 2000);
            }
        };
        
        // Botão para limpar
        const btnLimpar = document.createElement('button');
        btnLimpar.className = 'botao-dsf secundario';
        btnLimpar.innerHTML = '🧹 Limpar Destaques <span class="tooltip-dsf">Remove todos os marcadores de respostas</span>';
        btnLimpar.onclick = function() {
            document.querySelectorAll('.resposta-certa-dsf').forEach(el => {
                el.classList.remove('resposta-certa-dsf');
                const badge = el.querySelector('.badge-resposta-dsf');
                if (badge) badge.remove();
            });
        };
        
        // Botão de ajuda
        const btnAjuda = document.createElement('button');
        btnAjuda.className = 'botao-dsf secundario';
        btnAjuda.innerHTML = '❓ Ajuda <span class="tooltip-dsf">Mostra instruções detalhadas de uso</span>';
        btnAjuda.onclick = function() {
            alert(`AJUDA - Sala do Futuro Assistente\n\n1. Clique em "Revelar Respostas" para tentar identificar automaticamente.\n2. Se não funcionar, tente carregar todas as questões primeiro.\n3. Use "Limpar Destaques" para remover as marcações.\n\nDica: O script funciona melhor quando todas as questões estão completamente carregadas.`);
        };
        
        container.appendChild(btnRevelar);
        container.appendChild(btnLimpar);
        container.appendChild(btnAjuda);
        document.body.appendChild(container);
    }
    
    // Inicialização
    if (document.readyState === 'complete') {
        if (config.autoRun) encontrarRespostas();
        if (config.showButton) criarInterface();
    } else {
        window.addEventListener('load', function() {
            if (config.autoRun) encontrarRespostas();
            if (config.showButton) criarInterface();
        });
    }
})();
