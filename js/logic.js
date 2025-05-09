// Banco de demandas
let demandas = [];
let demandaId = 0;
let editandoDemanda = false;

// Calcula minutos trabalhados hoje
function calcularMinutosTrabalhadosHoje() {
  const agora = new Date();
  const diaSemana = agora.getDay();
  if (diaSemana === 0 || diaSemana === 6) return 0; // Fim de semana

  const dataHoje = agora.toDateString();
  const horaInicioManha = document.getElementById('inicioManha').value || '07:42';
  const horaFimManha = document.getElementById('fimManha').value || '12:00';
  const horaInicioTarde = document.getElementById('inicioTarde').value || '13:30';
  const horaFimTarde = document.getElementById('fimTarde').value || '18:00';

  const inicioManha = new Date(`${dataHoje} ${horaInicioManha}`);
  const fimManha = new Date(`${dataHoje} ${horaFimManha}`);
  const inicioTarde = new Date(`${dataHoje} ${horaInicioTarde}`);
  const fimTarde = new Date(`${dataHoje} ${horaFimTarde}`);

  if (agora < inicioManha) return 0;

  let minutosTotais = 0;

  if (agora <= fimManha) {
    minutosTotais += (agora - inicioManha) / 60000;
    return Math.floor(minutosTotais);
  } else {
    minutosTotais += (fimManha - inicioManha) / 60000;
  }

  if (agora < inicioTarde) return Math.floor(minutosTotais);

  if (agora <= fimTarde) {
    minutosTotais += (agora - inicioTarde) / 60000;
  } else {
    minutosTotais += (fimTarde - inicioTarde) / 60000;
  }

  return Math.floor(Math.min(minutosTotais, capacidadeDia()));
}

// Modo Dark
const toggleButton = document.getElementById('toggleDarkMode');

toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');

  // Salva no navegador
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('modo', 'dark');
  } else {
    localStorage.setItem('modo', 'light');
  }
});

// Quando carregar a página, mantém a preferência
window.addEventListener('load', () => {
  const modo = localStorage.getItem('modo');
  if (modo === 'dark') {
    document.body.classList.add('dark-mode');
  }
});

// Calcula a diferença das demandas para saber melhor cada minutos a declarar para não ficar errado
function calcularDiferencaTempo() {
  const minutosHoje = calcularMinutosTrabalhadosHoje();
  const minutosDemandas = demandas.reduce((acc, d) => acc + d.tempoGasto, 0);

  let diferenca = minutosHoje - minutosDemandas;

  let status = '';
  if (diferenca >= 0) {
    status = 'OK';
  } else {
    status = 'Rever Minutos';
  }

  const elemento = document.getElementById('diferencaTempo');
  if (elemento) {
    elemento.innerText = `Diferença: ${diferenca} Minuto (${status})`;
    elemento.style.color = diferenca >= 0 ? 'green' : 'red';
  }
}

// Capacidade total de minutos por dia
function capacidadeDia() {
  const dataHoje = new Date().toDateString();
  const horaInicioManha = document.getElementById('inicioManha').value || '07:42';
  const horaFimManha = document.getElementById('fimManha').value || '12:00';
  const horaInicioTarde = document.getElementById('inicioTarde').value || '13:30';
  const horaFimTarde = document.getElementById('fimTarde').value || '18:00';

  const inicioManha = new Date(`${dataHoje} ${horaInicioManha}`);
  const fimManha = new Date(`${dataHoje} ${horaFimManha}`);
  const inicioTarde = new Date(`${dataHoje} ${horaInicioTarde}`);
  const fimTarde = new Date(`${dataHoje} ${horaFimTarde}`);

  const minutosManha = (fimManha - inicioManha) / 60000;
  const minutosTarde = (fimTarde - inicioTarde) / 60000;

  return Math.floor(minutosManha + minutosTarde);
}

// Atualiza os minutos trabalhados e restantes
function atualizarDia() {
  if (!editandoDemanda) {
    const minutosHoje = calcularMinutosTrabalhadosHoje();
    const cap = capacidadeDia();
    let minutosRestantes = cap - minutosHoje;
    if (minutosRestantes < 0) minutosRestantes = 0;

    document.getElementById('minutosTrabalhadosDia').innerText = minutosHoje;
    document.getElementById('minutosRestantesDia').innerText = `Minutos restantes hoje: ${minutosRestantes}`;

    demandas.forEach(d => {
      if (!d.encerrada) {
        d.tempoGasto = d.tempoBase + (minutosHoje - d.minBase);
        if (d.tempoGasto < 0) d.tempoGasto = 0;
      }
    });

    if (!document.querySelector('#listaDemandas input[type="number"]')) {
      renderizarDemandas();
    }
    calcularDiferencaTempo();
  }
}

// Iniciar uma nova demanda
function iniciarDemanda() {
  const nomeInput = document.getElementById('demandaNome');
  const nome = nomeInput.value.trim();
  if (!nome) {
    alert('Por favor, informe o nome da demanda.');
    return;
  }

  demandaId++;
  const minutosHoje = calcularMinutosTrabalhadosHoje();

  demandas.push({
    id: demandaId,
    nome,
    startMinuto: minutosHoje,
    endMinuto: null,
    encerrada: false,
    tempoGasto: 0,
    tempoBase: 0,
    minBase: minutosHoje
  });

  nomeInput.value = '';
  renderizarDemandas();
}

// Encerrar demanda selecionada
function encerrarDemanda(id) {
  const demanda = demandas.find(d => d.id === id && !d.encerrada);
  if (!demanda) return;

  const minutosHoje = calcularMinutosTrabalhadosHoje();
  demanda.endMinuto = minutosHoje;
  demanda.encerrada = true;
  demanda.tempoGasto = demanda.tempoBase + (demanda.endMinuto - demanda.minBase);

  renderizarDemandas();
}

// Renderizar lista de demandas
function renderizarDemandas() {
  const ul = document.getElementById('listaDemandas');
  ul.innerHTML = '';

  demandas.forEach(d => {
    const li = document.createElement('li');
    li.classList.add('demanda-item');

    const spanTempo = document.createElement('span');
    spanTempo.textContent = `${d.nome} - Tempo gasto: ${d.tempoGasto} min`;
    spanTempo.style.cursor = 'pointer';
    spanTempo.title = 'Clique para editar o tempo';

    spanTempo.addEventListener('click', () => {
      editandoDemanda = true;
      const inputTempo = document.createElement('input');
      inputTempo.type = 'number';
      inputTempo.value = d.tempoGasto;
      inputTempo.style.width = '60px';

      const salvarValor = () => {
        const novoTempo = parseInt(inputTempo.value, 10);
        if (!isNaN(novoTempo)) {
          const minutosHoje = calcularMinutosTrabalhadosHoje();
          if (novoTempo > minutosHoje) {
            alert(`Não é possível definir mais do que ${minutosHoje} minutos!`);
            d.tempoBase = minutosHoje;
          } else {
            d.tempoBase = novoTempo;
          }
          d.minBase = minutosHoje;
        }
        renderizarDemandas();
        editandoDemanda = false;
      };

      inputTempo.addEventListener('blur', salvarValor);
      inputTempo.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') salvarValor();
      });

      li.replaceChild(inputTempo, spanTempo);
      inputTempo.focus();
    });

    li.appendChild(spanTempo);

    if (!d.encerrada) {
      const btnEncerrar = document.createElement('button');
      btnEncerrar.classList.add('btn');
      btnEncerrar.textContent = 'Encerrar';
      btnEncerrar.onclick = () => encerrarDemanda(d.id);
      li.appendChild(btnEncerrar);
    } else {
      li.classList.add('encerrada');
    }

    ul.appendChild(li);
  });
}

// Atualização inicial e listener para horários
window.addEventListener('DOMContentLoaded', () => {
  setInterval(atualizarDia, 1000);
  atualizarDia();
});

['inicioManha', 'fimManha', 'inicioTarde', 'fimTarde'].forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('change', atualizarDia);
  }
});
