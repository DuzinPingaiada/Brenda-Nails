import { fmtDateBR, todayISO } from '../utils/date.js';
import { toWhatsAppE164 } from '../utils/phone.js';
import { state } from '../state.js';

function getValidAgendamentos() {
  return (state.ags || []).filter((a) =>
    a &&
    typeof a.id === 'string' &&
    typeof a.nome === 'string' &&
    typeof a.data === 'string' &&
    typeof a.horario === 'string' &&
    typeof a.status === 'string'
  );
}

export function renderStats() {
  const list = getValidAgendamentos();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startW = new Date(now);
  startW.setDate(now.getDate() - now.getDay());
  const endW = new Date(startW);
  endW.setDate(startW.getDate() + 6);
  const hoje = list.filter((a) => a.data === todayISO() && a.status !== 'cancelado').length;
  const semana = list.filter((a) => {
    const d = new Date(a.data + 'T00:00');
    return d >= startW && d <= endW && a.status !== 'cancelado';
  }).length;
  const mes = list.filter((a) => a.data.startsWith(ym) && a.status !== 'cancelado').length;
  document.getElementById('stats-cont').innerHTML = `
    <div class="stat-card"><div class="stat-num">${hoje}</div><div class="stat-label">Hoje</div></div>
    <div class="stat-card"><div class="stat-num">${semana}</div><div class="stat-label">Semana</div></div>
    <div class="stat-card"><div class="stat-num">${mes}</div><div class="stat-label">Mês</div></div>`;
}

export function cardHTML(a, hideDate) {
  const sm = {
    confirmado: { l: 'Confirmado', c: 's-confirmado' },
    pendente: { l: 'Pendente', c: 's-pendente' },
    cancelado: { l: 'Cancelado', c: 's-cancelado' },
    concluido: { l: 'Concluído', c: 's-concluido' },
  };
  const st = sm[a.status] || sm.confirmado;
  const phoneHref = toWhatsAppE164(a.telefone);

  return `<div class="apt-card" id="card-${a.id}">
    <div class="card-top">
      <div class="card-header">
        <div class="client-name">${a.nome}</div>
        <div class="time-badge">${a.horario}</div>
      </div>
      ${a.servico ? `<div class="card-servico">${a.servico}</div>` : ''}
      <div class="card-tags">
        ${a.preco ? `<span class="tag tag-price">💰 R$ ${parseFloat(a.preco).toFixed(2).replace('.', ',')}</span>` : ''}
        ${!hideDate ? `<span class="tag tag-date">📅 ${fmtDateBR(a.data)}</span>` : ''}
        <span class="status-badge ${st.c}">${st.l}</span>
      </div>
    </div>
    ${a.telefone ? `
    <div class="card-phone-row">
      <a class="card-phone-link" href="${phoneHref}" target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.307A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="#25D366" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${a.telefone}
      </a>
    </div>` : ''}
    ${a.obs ? `<div class="card-obs">"${a.obs}"</div>` : ''}
    <div class="card-actions">
      <button class="act-btn" data-action="editar" data-id="${a.id}">Editar</button>
      ${a.status !== 'concluido'
        ? `<button class="act-btn done" data-action="finalizar" data-id="${a.id}">Finalizar</button>`
        : `<button class="act-btn done" style="color:#aaa">Pago ${a.preco ? 'R$' + parseFloat(a.preco).toFixed(2).replace('.', ',') : ''}</button>`}
      ${a.status !== 'cancelado'
        ? `<button class="act-btn cancel" data-action="cancelar" data-id="${a.id}">Cancelar</button>`
        : `<button class="act-btn" data-action="reativar" data-id="${a.id}">Reativar</button>`}
      <button class="act-btn del" data-action="excluir" data-id="${a.id}">Excluir</button>
    </div>
  </div>`;
}

export function renderAgenda() {
  const list = getValidAgendamentos();
  renderStats();
  const filtroData = document.getElementById('filtro-data').value;
  const filtroNome = (document.getElementById('filtro-nome-aberto').value || '').trim().toLowerCase();
  let base = filtroData ? list.filter((a) => a.data === filtroData) : [...list];
  if (filtroNome) base = base.filter((a) => (a.nome || '').toLowerCase().includes(filtroNome));
  base.sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  const abertos = base.filter((a) => a.status !== 'concluido' && a.status !== 'cancelado');
  const openEl = document.getElementById('agenda-open-list');
  const btn = document.getElementById('btn-abertos');
  btn.textContent = state.mostrarAbertosAgenda ? 'Ocultar em aberto' : 'Mostrar em aberto';

  if (!state.mostrarAbertosAgenda) {
    openEl.innerHTML = `<div class="empty-state"><p>Lista de em aberto oculta.</p></div>`;
    return;
  }

  if (!abertos.length) {
    openEl.innerHTML = `<div class="empty-state">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="#dbbba8" stroke-width="1.5"/><path d="M8 2v4M16 2v4M3 10h18" stroke="#dbbba8" stroke-width="1.5" stroke-linecap="round"/></svg>
      <p>Nenhum agendamento em aberto${filtroData ? ' para ' + fmtDateBR(filtroData) : ''}</p>
    </div>`;
  } else {
    openEl.innerHTML = abertos.map((a) => cardHTML(a, !!filtroData)).join('');
  }
}

export function renderPainel() {
  const list = getValidAgendamentos();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startW = new Date(now);
  startW.setDate(now.getDate() - now.getDay());
  const endW = new Date(startW);
  endW.setDate(startW.getDate() + 6);
  const conc = list.filter((a) => a.status === 'concluido');
  const concMes = conc.filter((a) => a.data.startsWith(ym));
  const concSem = conc.filter((a) => {
    const d = new Date(a.data + 'T00:00');
    return d >= startW && d <= endW;
  });
  const fat = (list) => list.reduce((s, a) => s + (parseFloat(a.preco) || 0), 0);
  document.getElementById('fat-section').innerHTML = `
    <div class="fat-card">
      <div class="fat-title">✦ Faturamento (serviços concluídos)</div>
      <div class="fat-grid">
        <div class="fat-item"><div class="fat-val">R$${fat(concSem).toFixed(2).replace('.', ',')}</div><div class="fat-lab">Esta semana</div></div>
        <div class="fat-item"><div class="fat-val">R$${fat(concMes).toFixed(2).replace('.', ',')}</div><div class="fat-lab">Este mês</div></div>
        <div class="fat-item"><div class="fat-val">${conc.length}</div><div class="fat-lab">Concluídos</div></div>
      </div>
    </div>`;

  const btn = document.getElementById('btn-finalizados');
  btn.textContent = state.mostrarFinalizadosPainel ? 'Ocultar finalizados' : 'Mostrar finalizados';
  const listEl = document.getElementById('painel-finalizados-list');
  if (!state.mostrarFinalizadosPainel) {
    listEl.innerHTML = `<div class="empty-state"><p>Toque no botão para ver os finalizados.</p></div>`;
    return;
  }

  const nomeFiltro = (document.getElementById('filtro-nome-finalizados').value || '').trim().toLowerCase();
  const dataFiltro = document.getElementById('filtro-data-finalizados').value;
  const finalizados = [...conc]
    .filter((a) => !nomeFiltro || (a.nome || '').toLowerCase().includes(nomeFiltro))
    .filter((a) => !dataFiltro || a.data === dataFiltro)
    .sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));

  listEl.innerHTML = finalizados.length
    ? finalizados.map((a) => cardHTML(a, false)).join('')
    : `<div class="empty-state"><p>Nenhum agendamento finalizado.</p></div>`;
}

