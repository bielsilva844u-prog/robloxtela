const packages = [
  { amount: "24.000", old: "22.500", bonus: "1500 a mais", price: "R$ 1.179,90" },
  { amount: "11.000", old: "10.000", bonus: "1000 a mais", price: "R$ 589,90" },
  { amount: "5.250", old: "4.500", bonus: "750 a mais", price: "R$ 294,90" },
  { amount: "3.625", old: "3.150", bonus: "475 a mais", price: "R$ 199,90" },
  { amount: "2.000", old: "1.700", bonus: "300 a mais", price: "R$ 117,90" },
];

const sendAmounts = [25, 50, 100, 200];
const accountAvatar = "https://i.ibb.co/tM0y26Xd/no-Filter.webp";
const fallbackAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%23252832'/%3E%3Ccircle cx='48' cy='36' r='15' fill='%237f8796'/%3E%3Cpath d='M20 82c5-19 19-29 28-29s23 10 28 29' fill='%237f8796'/%3E%3C/svg%3E";

let selectedUser = null;
let selectedAmount = 25;
let robuxBalance = 83268;

const amountButtons = document.querySelector("#amountButtons");
const addRobuxButton = document.querySelector("#addRobuxButton");
const addRobuxInput = document.querySelector("#addRobuxInput");
const closeModal = document.querySelector("#closeModal");
const confirmAmount = document.querySelector("#confirmAmount");
const confirmAvatar = document.querySelector("#confirmAvatar");
const confirmName = document.querySelector("#confirmName");
const confirmSend = document.querySelector("#confirmSend");
const confirmStep = document.querySelector("#confirmStep");
const confirmUsername = document.querySelector("#confirmUsername");
const customAmount = document.querySelector("#customAmount");
const editSend = document.querySelector("#editSend");
const lookupButton = document.querySelector("#lookupButton");
const modalBalance = document.querySelector("#modalBalance");
const nextButton = document.querySelector("#nextButton");
const openSend = document.querySelector("#openSend");
const overlay = document.querySelector("#overlay");
const packagesEl = document.querySelector("#packages");
const profileAvatar = document.querySelector("#profileAvatar");
const profileName = document.querySelector("#profileName");
const profileUsername = document.querySelector("#profileUsername");
const results = document.querySelector("#results");
const safeNote = document.querySelector("#safeNote");
const searchStep = document.querySelector("#searchStep");
const selectedAmountEl = document.querySelector("#selectedAmount");
const sendStep = document.querySelector("#sendStep");
const settingsBalance = document.querySelector("#settingsBalance");
const settingsButton = document.querySelector("#settingsButton");
const settingsMenu = document.querySelector("#settingsMenu");
const sideAvatar = document.querySelector("#sideAvatar");
const topAvatar = document.querySelector("#topAvatar");
const topBalance = document.querySelector("#topBalance");
const toast = document.querySelector("#toast");
const toastAvatar = document.querySelector("#toastAvatar");
const toastText = document.querySelector("#toastText");
const walletBalance = document.querySelector("#walletBalance");
const username = document.querySelector("#username");
let toastTimer;

function coin() {
  return '<i class="coin" aria-hidden="true"></i>';
}

function robuxImageIcon() {
  return '<img class="robux-icon" src="https://i.ibb.co/svdv5vkP/Robux-2019-Logo-Black-svg.png" alt="" />';
}

function renderPackages() {
  packagesEl.innerHTML = packages
    .map(
      (item) => `
        <article class="package">
          <div class="robux-line">
            ${robuxImageIcon()}
            <strong>${item.amount}</strong>
            <span class="old">${item.old}</span>
          </div>
          <span class="tag">${item.bonus}</span>
          <button class="price" type="button">${item.price}</button>
        </article>
      `,
    )
    .join("");
}

function renderAmounts() {
  amountButtons.innerHTML = sendAmounts
    .map(
      (amount) => `
        <button type="button" data-amount="${amount}" aria-pressed="${amount === selectedAmount}">
          ${coin()} ${amount}
        </button>
      `,
    )
    .join("");
}

function normalizeAmount(value) {
  const amount = Number.parseInt(String(value).replace(/\D/g, ""), 10);

  if (!Number.isFinite(amount) || amount < 1) {
    return 1;
  }

  return Math.min(amount, 1000000);
}

function formatAmount(value) {
  return normalizeAmount(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function setSelectedAmount(value) {
  selectedAmount = normalizeAmount(value);
  customAmount.value = formatAmount(selectedAmount);
  selectedAmountEl.textContent = formatAmount(selectedAmount);

  amountButtons.querySelectorAll("button").forEach((item) => {
    item.setAttribute("aria-pressed", String(Number(item.dataset.amount) === selectedAmount));
  });
}

function showToast() {
  if (!selectedUser) return;

  window.clearTimeout(toastTimer);
  toastAvatar.src = selectedUser.avatarUrl || fallbackAvatar;
  toastText.innerHTML = `@${selectedUser.name} recebeu <i class="coin"></i> ${formatAmount(selectedAmount)}`;
  toast.hidden = false;

  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4200);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("A API retornou uma página em vez de JSON. Recarregue e tente de novo.");
  }

  if (!response.ok) {
    throw new Error(payload.error || "Erro ao consultar API");
  }

  return payload;
}

async function lookupRobloxUserFromStaticPage(name) {
  let userPayload;

  const rotunnelLookupUrl = new URL("https://users.rotunnel.com/v1/usernames/users");
  rotunnelLookupUrl.searchParams.set("_", String(Date.now()));

  try {
    userPayload = await fetchJson(rotunnelLookupUrl, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ usernames: [name], excludeBannedUsers: true }),
    });
  } catch {
    userPayload = await fetchJson("https://users.roproxy.com/v1/usernames/users", {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ usernames: [name], excludeBannedUsers: true }),
    });
  }

  const user = userPayload.data?.[0] ?? null;

  if (!user) {
    return null;
  }

  const avatarUrl = new URL("https://thumbnails.roproxy.com/v1/users/avatar-headshot");
  avatarUrl.searchParams.set("userIds", String(user.id));
  avatarUrl.searchParams.set("size", "150x150");
  avatarUrl.searchParams.set("format", "Png");
  avatarUrl.searchParams.set("isCircular", "true");

  let avatarPayload;

  try {
    avatarPayload = await fetchJson(avatarUrl);
  } catch {
    avatarUrl.hostname = "thumbnails.rotunnel.com";
    avatarPayload = await fetchJson(avatarUrl);
  }

  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    avatarUrl: avatarPayload.data?.[0]?.imageUrl ?? "",
  };
}

async function lookupRobloxUser(name) {
  const isLocalServer = location.hostname === "127.0.0.1" || location.hostname === "localhost";

  if (isLocalServer) {
    try {
      return await fetchJson(`/api/roblox-user?username=${encodeURIComponent(name)}`);
    } catch {
      return lookupRobloxUserFromStaticPage(name);
    }
  }

  return lookupRobloxUserFromStaticPage(name);
}

function resetModal() {
  selectedUser = null;
  username.value = "";
  results.innerHTML = '<p class="empty">Digite um usuário Roblox e clique em Buscar.</p>';
  profileAvatar.src = fallbackAvatar;
  profileName.textContent = "Usuário";
  profileUsername.textContent = "@usuario";
  safeNote.textContent = "";
  searchStep.hidden = false;
  sendStep.hidden = true;
  confirmStep.hidden = true;
}

function openModal() {
  resetModal();
  overlay.hidden = false;
  requestAnimationFrame(() => username.focus());
}

function close() {
  overlay.hidden = true;
}

function selectUser(user) {
  selectedUser = user;
  profileAvatar.src = user.avatarUrl || fallbackAvatar;
  profileName.textContent = user.name;
  profileUsername.textContent = user.displayName && user.displayName !== user.name ? user.displayName : `@${user.name}`;
  setSelectedAmount(selectedAmount);
  searchStep.hidden = true;
  sendStep.hidden = false;
  confirmStep.hidden = true;
  requestAnimationFrame(() => customAmount.focus());
}

function amountText() {
  return formatAmount(selectedAmount);
}

function renderBalance() {
  const formatted = robuxBalance.toLocaleString("pt-BR");
  topBalance.textContent = formatted;
  walletBalance.textContent = formatted;
  modalBalance.textContent = formatted;
  settingsBalance.textContent = formatted;
}

function showConfirmStep() {
  if (!selectedUser) return;

  confirmAvatar.src = selectedUser.avatarUrl || fallbackAvatar;
  confirmName.textContent = selectedUser.name;
  confirmUsername.textContent =
    selectedUser.displayName && selectedUser.displayName !== selectedUser.name ? selectedUser.displayName : `@${selectedUser.name}`;
  confirmAmount.textContent = amountText();
  searchStep.hidden = true;
  sendStep.hidden = true;
  confirmStep.hidden = false;
}

function renderResult(user) {
  results.innerHTML = `
    <button class="result" type="button">
      <img src="${user.avatarUrl || fallbackAvatar}" alt="" />
      <span>
        <strong>${user.displayName || user.name}</strong>
        <span>@${user.name}</span>
      </span>
    </button>
  `;
  results.querySelector(".result").addEventListener("click", () => selectUser(user));
}

async function lookup() {
  const name = username.value.trim();
  if (name.length < 3) {
    results.innerHTML = '<p class="empty">Digite pelo menos 3 caracteres.</p>';
    return;
  }

  results.innerHTML = '<p class="empty">Buscando usuário real no Roblox...</p>';

  try {
    const user = await lookupRobloxUser(name);
    if (!user?.id) {
      results.innerHTML = `<p class="empty">@${name} não encontrado.</p>`;
      return;
    }
    renderResult(user);
  } catch (error) {
    results.innerHTML = `<p class="empty">${error.message || "Não foi possível acessar a API pública agora."}</p>`;
  }
}

amountButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-amount]");
  if (!button) return;

  selectedAmount = Number(button.dataset.amount);
  setSelectedAmount(selectedAmount);
});

customAmount.addEventListener("input", () => {
  const digits = customAmount.value.replace(/\D/g, "");

  if (!digits) {
    customAmount.value = "";
    selectedAmountEl.textContent = "0";
    return;
  }

  selectedAmount = normalizeAmount(digits);
  customAmount.value = formatAmount(selectedAmount);
  selectedAmountEl.textContent = formatAmount(selectedAmount);
  amountButtons.querySelectorAll("button").forEach((item) => {
    item.setAttribute("aria-pressed", String(Number(item.dataset.amount) === selectedAmount));
  });
});

customAmount.addEventListener("blur", () => {
  setSelectedAmount(customAmount.value);
});

nextButton.addEventListener("click", () => {
  setSelectedAmount(customAmount.value);
  showConfirmStep();
});

editSend.addEventListener("click", () => {
  confirmStep.hidden = true;
  sendStep.hidden = false;
  requestAnimationFrame(() => customAmount.focus());
});

confirmSend.addEventListener("click", () => {
  if (!selectedUser) return;

  if (selectedAmount > robuxBalance) {
    safeNote.textContent = "";
    confirmStep.hidden = true;
    sendStep.hidden = false;
    return;
  }

  robuxBalance -= selectedAmount;
  renderBalance();

  safeNote.textContent = "";
  showToast();
  close();
});

settingsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  settingsMenu.hidden = !settingsMenu.hidden;
});

addRobuxButton.addEventListener("click", () => {
  const amount = normalizeAmount(addRobuxInput.value);
  robuxBalance += amount;
  renderBalance();
  settingsMenu.hidden = true;
});

settingsMenu.addEventListener("click", (event) => {
  event.stopPropagation();
  const button = event.target.closest("button[data-add]");
  if (!button) return;

  addRobuxInput.value = String(Number(button.dataset.add));
});

document.addEventListener("click", (event) => {
  if (!settingsMenu.hidden && !settingsMenu.contains(event.target) && event.target !== settingsButton) {
    settingsMenu.hidden = true;
  }
});

lookupButton.addEventListener("click", lookup);
username.addEventListener("keydown", (event) => {
  if (event.key === "Enter") lookup();
});
openSend.addEventListener("click", openModal);
closeModal.addEventListener("click", close);
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) close();
});

renderPackages();
renderAmounts();
setSelectedAmount(selectedAmount);
renderBalance();
topAvatar.src = accountAvatar;
sideAvatar.src = accountAvatar;
profileAvatar.src = fallbackAvatar;
