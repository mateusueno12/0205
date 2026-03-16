// Função para formatar o CNPJ enquanto digita
function formatarCNPJ(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length <= 14) {
        if (valor.length <= 2) {
            valor = valor;
        } else if (valor.length <= 5) {
            valor = valor.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
        } else if (valor.length <= 8) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
        } else if (valor.length <= 12) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
        } else if (valor.length <= 14) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
        }
    }
    
    input.value = valor;
}

// Função para validar CNPJ
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    
    // Elimina CNPJs invalidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Valida primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
        soma += parseInt(cnpj.charAt(i)) * peso;
        peso = peso === 2 ? 9 : peso - 1;
    }
    
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cnpj.charAt(12)) !== digito1) return false;
    
    // Valida segundo dígito verificador
    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
        soma += parseInt(cnpj.charAt(i)) * peso;
        peso = peso === 2 ? 9 : peso - 1;
    }
    
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cnpj.charAt(13)) === digito2;
}

// Função principal de consulta
async function consultarCNPJ() {
    const input = document.getElementById('cnpjInput');
    let cnpj = input.value.replace(/[^\d]/g, '');
    
    if (!cnpj) {
        mostrarErro('Por favor, digite um CNPJ');
        return;
    }
    
    if (!validarCNPJ(cnpj)) {
        mostrarErro('CNPJ inválido. Verifique o número digitado.');
        return;
    }
    
    mostrarLoading(true);
    limparErro();
    
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('CNPJ não encontrado');
            } else {
                throw new Error('Erro na consulta. Tente novamente.');
            }
        }
        
        const data = await response.json();
        exibirResultado(data);
        
    } catch (error) {
        mostrarErro(error.message);
        document.getElementById('result').classList.add('hidden');
    } finally {
        mostrarLoading(false);
    }
}

// Função para exibir os resultados
function exibirResultado(data) {
    const infoContainer = document.getElementById('infoContainer');
    infoContainer.innerHTML = '';
    
    const campos = [
        { label: 'CNPJ', value: data.cnpj, format: formatarCNPJString },
        { label: 'Razão Social', value: data.razao_social },
        { label: 'Nome Fantasia', value: data.nome_fantasia || 'Não informado' },
        { label: 'Situação Cadastral', value: `${data.descricao_situacao_cadastral} (${data.data_situacao_cadastral})` },
        { label: 'Data de Abertura', value: data.data_inicio_atividade },
        { label: 'Porte da Empresa', value: data.porte?.descricao || 'Não informado' },
        { label: 'Natureza Jurídica', value: data.natureza_juridica || 'Não informado' },
        { 
            label: 'Atividade Principal', 
            value: data.cnae_fiscal_descricao || 'Não informado',
            fullWidth: true 
        },
        { 
            label: 'Atividades Secundárias', 
            value: data.cnaes_secundarios?.map(c => c.descricao).join(', ') || 'Não informado',
            fullWidth: true 
        },
        { label: 'Capital Social', value: formatarMoeda(data.capital_social) },
        { label: 'Endereço', value: formatarEndereco(data), fullWidth: true },
        { label: 'Telefone', value: data.telefone1 || 'Não informado' },
        { label: 'E-mail', value: data.email || 'Não informado' },
        { label: 'Quadro de Sócios', value: formatarSocios(data.qsa), fullWidth: true },
        { label: 'Última Atualização', value: data.ultima_atualizacao || 'Não informado' }
    ];
    
    campos.forEach(campo => {
        if (campo.value && campo.value !== 'Não informado') {
            const div = document.createElement('div');
            div.className = campo.fullWidth ? 'info-item full-width' : 'info-item';
            div.innerHTML = `
                <div class="info-label">${campo.label}</div>
                <div class="info-value">${campo.value}</div>
            `;
            infoContainer.appendChild(div);
        }
    });
    
    document.getElementById('result').classList.remove('hidden');
}

// Funções auxiliares de formatação
function formatarCNPJString(cnpj) {
    if (!cnpj) return 'Não informado';
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatarMoeda(valor) {
    if (!valor) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarEndereco(data) {
    const partes = [];
    if (data.logradouro) partes.push(data.logradouro);
    if (data.numero) partes.push(data.numero);
    if (data.complemento) partes.push(data.complemento);
    if (data.bairro) partes.push(data.bairro);
    if (data.municipio) partes.push(data.municipio);
    if (data.uf) partes.push(`- ${data.uf}`);
    if (data.cep) partes.push(`CEP: ${data.cep}`);
    
    return partes.length ? partes.join(', ') : 'Endereço não informado';
}

function formatarSocios(socios) {
    if (!socios || !socios.length) return 'Não informado';
    
    return socios.map(s => {
        const nome = s.nome_socio || s.nome_socio_razao || 'Nome não informado';
        const qualificacao = s.qualificacao_socio || '';
        const percentual = s.percentual_capital_social ? 
            ` - ${s.percentual_capital_social}% do capital` : '';
        return `${nome} (${qualificacao}${percentual})`;
    }).join('<br>');
}

// Função para gerar PDF
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const infoItems = document.querySelectorAll('#infoContainer .info-item');
    
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Consulta CNPJ', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    
    let yPos = 50;
    const lineHeight = 10;
    const pageHeight = doc.internal.pageSize.height;
    
    infoItems.forEach((item, index) => {
        if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
        }
        
        const label = item.querySelector('.info-label').textContent;
        const value = item.querySelector('.info-value').innerHTML.replace(/<br>/g, ', ');
        
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(label, 20, yPos);
        
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        
        const lines = doc.splitTextToSize(value, 170);
        doc.text(lines, 20, yPos + 5);
        
        yPos += (lines.length * lineHeight) + 10;
        
        doc.setDrawColor(240, 240, 240);
        doc.line(20, yPos - 5, 190, yPos - 5);
    });
    
    doc.save('consulta-cnpj.pdf');
}

// Funções de utilidade
function mostrarLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function mostrarErro(mensagem) {
    const error = document.getElementById('error');
    error.textContent = mensagem;
    error.classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
}

function limparErro() {
    document.getElementById('error').classList.add('hidden');
}

// Adiciona evento de tecla Enter
document.getElementById('cnpjInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        consultarCNPJ();
    }
});
