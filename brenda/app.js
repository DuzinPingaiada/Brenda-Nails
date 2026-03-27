import { initFirebase } from './services/firebaseInit.js';
import { onAuthStateChanged, signInWithEmailPassword, signOut } from './services/authService.js';
import { listenAgendamentos, upsertAgendamento, deleteAgendamento } from './services/databaseService.js';
import { todayISO } from './utils/date.js';
import { formatTelefoneBR } from './utils/phone.js';
import { loadCachedAgendamentos, saveCachedAgendamentos } from './utils/storage.js';
import { showToast } from './components/toast.js';
import { state } from './state.js';
import { renderAgenda, renderPainel } from './pages/renderers.js';

initFirebase();

function $(id) { return document.getElementById(id); }
function isValidAgendamento(a) {
  return !!(
    a &&
    typeof a.id === 'string' &&
    typeof a.nome === 'string' &&
    typeof a.data === 'string' &&
    typeof a.horario === 'string' &&
    typeof a.status === 'string'
  );
}

function abrirApp() {
  $('login-screen').style.display = 'none';
  $('app').style.display = 'block';
}

function fecharApp() {
  $('login-screen').style.display = 'flex';
  $('app').style.display = 'none';
}

function setActiveTab(tab) {
  const tabs = ['agenda', 'novo', 'painel'];
  tabs.forEach((t) => {
    $(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
    $(`nav-${t}`).classList.toggle('active', t === tab);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (tab === 'agenda') renderAgenda();
  if (tab === 'painel') renderPainel();
  if (tab === 'novo' && !state.editId) resetForm();
}

function resetForm() {
  state.editId = null;
  state.selHorario = null;
  $('f-nome').value = '';
  $('f-tel').value = '';
  $('f-data').value = todayISO();
  $('f-status').value = 'confirmado';
  $('f-horario').value = '';
  $('f-servico').value = '';
  $('f-obs').value = '';
  $('form-title-sec').textContent = 'Novo Agendamento';
  $('btn-salvar').textContent = 'Confirmar Agendamento';
}

function startEdit(id) {
  const a = state.ags.find((x) => x.id === id);
  if (!a) return;
  state.editId = id;
  state.selHorario = a.horario;
  $('f-nome').value = a.nome;
  $('f-tel').value = a.telefone || '';
  $('f-data').value = a.data;
  $('f-status').value = a.status;
  $('f-horario').value = a.horario || '';
  $('f-servico').value = a.servico || '';
  $('f-obs').value = a.obs || '';
  $('form-title-sec').textContent = 'Editar Agendamento';
  $('btn-salvar').textContent = 'Salvar Alterações';
  setActiveTab('novo');
}

async function salvar() {
  const nome = $('f-nome').value.trim();
  const servico = $('f-servico').value.trim();
  const horario = ($('f-horario').value || '').trim();
  if (!nome || !horario) { showToast('Preencha o nome e o horário!'); return; }
  if (!/^\d{2}:\d{2}$/.test(horario)) { showToast('Digite o horário no formato HH:MM.'); return; }

  const id = state.editId || `ag_${Date.now()}`;
  const obj = {
    id,
    nome,
    telefone: $('f-tel').value.trim(),
    data: $('f-data').value,
    horario,
    servico,
    status: $('f-status').value,
    obs: $('f-obs').value.trim(),
    preco: state.editId ? (state.ags.find((a) => a.id === state.editId)?.preco || '') : '',
  };

  const isEdit = !!state.editId;
  // Feedback imediato para não "travar" a tela aguardando rede.
  showToast(isEdit ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!');
  setActiveTab('agenda');
  state.mostrarAbertosAgenda = true;
  $('filtro-data').value = obj.data || todayISO();
  renderAgenda();
  await saveAgendamento(obj);
}

async function saveAgendamento(obj) {
  const i = state.ags.findIndex((a) => a.id === obj.id);
  if (i >= 0) state.ags[i] = obj;
  else state.ags.push(obj);
  saveCachedAgendamentos(state.ags);
  // Sincroniza em background para não bloquear confirmação visual.
  upsertAgendamento(obj).catch((err) => {
    console.error(err);
    showToast('Salvo localmente. Sincroniza ao reconectar.');
  });
}

async function removeAgendamento(id) {
  state.ags = state.ags.filter((a) => a.id !== id);
  saveCachedAgendamentos(state.ags);
  deleteAgendamento(id).catch((err) => {
    console.error(err);
    showToast('Excluído localmente. Sincroniza ao reconectar.');
  });
  renderAgenda();
  renderPainel();
}

async function setStatus(id, status) {
  const a = state.ags.find((x) => x.id === id);
  if (!a) return;
  a.status = status;
  await saveAgendamento(a);
  showToast('Status atualizado!');
  renderAgenda();
  renderPainel();
}

// Finalizar modal
function openFin(id) {
  const a = state.ags.find((x) => x.id === id);
  if (!a) return;
  state.finId = id;
  $('fin-client-name').textContent = a.nome;
  $('fin-preco').value = a.preco || '';
  $('fin-obs').value = '';
  $('fin-modal').classList.add('show');
}
function closeFin() {
  state.finId = null;
  $('fin-modal').classList.remove('show');
}
async function confirmarFinalizar() {
  const a = state.ags.find((x) => x.id === state.finId);
  if (!a) return;
  const preco = $('fin-preco').value;
  const obs = $('fin-obs').value.trim();
  a.status = 'concluido';
  a.preco = preco;
  if (obs) a.obs = (a.obs ? a.obs + ' | ' : '') + obs;
  // Fecha imediatamente para não depender da rede.
  closeFin();
  showToast('Agendamento finalizado com sucesso!');
  renderAgenda();
  renderPainel();
  await saveAgendamento(a);
}

// Delete modal
function openDel(id) {
  state.delId = id;
  $('del-modal').classList.add('show');
}
function closeDel() {
  state.delId = null;
  $('del-modal').classList.remove('show');
}

function initData() {
  $('filtro-data').value = todayISO();
  state.ags = loadCachedAgendamentos().filter(isValidAgendamento);
  renderAgenda();
  renderPainel();
  if (state.stopListener) state.stopListener();
  state.stopListener = listenAgendamentos(
    (list) => {
      state.ags = list.filter(isValidAgendamento);
      saveCachedAgendamentos(state.ags);
      renderAgenda();
      renderPainel();
    },
    () => {
      state.ags = loadCachedAgendamentos();
      renderAgenda();
      renderPainel();
      showToast('Firebase indisponível. Exibindo dados locais.');
    }
  );
}

function wireEvents() {
  // Login
  $('btn-entrar').addEventListener('click', async () => {
    const email = $('email').value.trim();
    const senha = $('senha').value;
    if (!email || !senha) { $('login-error').textContent = 'Informe e-mail e senha.'; return; }
    if (location.protocol === 'file:') { $('login-error').textContent = 'Abra pelo localhost (ex.: Live Server), não por arquivo direto.'; return; }
    try {
      await signInWithEmailPassword(email, senha);
      $('login-error').textContent = '';
    } catch (e) {
      $('login-error').textContent = 'Não foi possível entrar. Verifique e-mail/senha.';
      console.error(e);
    }
  });
  $('senha').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-entrar').click(); });
  $('email').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-entrar').click(); });

  $('btn-sair').addEventListener('click', async () => {
    await signOut();
    if (state.stopListener) { state.stopListener(); state.stopListener = null; }
  });

  // Tabs
  $('nav-agenda').addEventListener('click', () => setActiveTab('agenda'));
  $('nav-novo').addEventListener('click', () => setActiveTab('novo'));
  $('nav-painel').addEventListener('click', () => setActiveTab('painel'));

  // Filters
  $('btn-hoje').addEventListener('click', () => { $('filtro-data').value = todayISO(); renderAgenda(); });
  $('btn-todos').addEventListener('click', () => { $('filtro-data').value = ''; renderAgenda(); });
  $('filtro-data').addEventListener('change', renderAgenda);
  $('filtro-nome-aberto').addEventListener('input', renderAgenda);

  // Toggle open section
  $('btn-abertos').addEventListener('click', () => { state.mostrarAbertosAgenda = !state.mostrarAbertosAgenda; renderAgenda(); });

  // Painel filters/toggle
  $('btn-finalizados').addEventListener('click', () => { state.mostrarFinalizadosPainel = !state.mostrarFinalizadosPainel; renderPainel(); });
  $('filtro-nome-finalizados').addEventListener('input', renderPainel);
  $('filtro-data-finalizados').addEventListener('change', renderPainel);

  // Form
  $('btn-salvar').addEventListener('click', salvar);
  $('f-horario').addEventListener('input', () => { state.selHorario = $('f-horario').value; });
  $('f-tel').addEventListener('input', (e) => { e.target.value = formatTelefoneBR(e.target.value); });

  // Delegated card actions
  document.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'editar') startEdit(id);
    if (action === 'finalizar') openFin(id);
    if (action === 'cancelar') setStatus(id, 'cancelado');
    if (action === 'reativar') setStatus(id, 'confirmado');
    if (action === 'excluir') openDel(id);
  });

  // Modals
  $('btn-fin-confirm').addEventListener('click', confirmarFinalizar);
  $('btn-fin-cancel').addEventListener('click', closeFin);
  $('fin-modal').addEventListener('click', (e) => { if (e.target === $('fin-modal')) closeFin(); });

  $('btn-del-confirm').addEventListener('click', () => removeAgendamento(state.delId));
  $('btn-del-cancel').addEventListener('click', closeDel);
  $('del-modal').addEventListener('click', (e) => { if (e.target === $('del-modal')) closeDel(); });
}

wireEvents();

onAuthStateChanged((user) => {
  if (user) {
    abrirApp();
    if (!state.appStarted) {
      initData();
      state.appStarted = true;
    }
  } else {
    state.appStarted = false;
    fecharApp();
  }
});

