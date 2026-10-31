<template>
  <section class="page">
    <div class="tabs">
      <button :class="['tab', { 'tab--active': activeTab === 'groups' }]" type="button" @click="activeTab = 'groups'">Groups</button>
      <button :class="['tab', { 'tab--active': activeTab === 'transactions' }]" type="button" @click="activeTab = 'transactions'">Transactions</button>
      <button :class="['tab', { 'tab--active': activeTab === 'orders' }]" type="button" @click="activeTab = 'orders'">Deposit Records</button>
    </div>

    <!-- Groups -->
    <div v-show="activeTab === 'groups'" class="tab-panel">
      <div class="card filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">Group ID</label><input v-model="groupFilters.groupId" class="input" placeholder="-100..." @input="onGroupSearchInput('groupId')" @keyup.enter="fetchGroups(1)" /></div>
          <div class="field"><label class="field-label">UID</label><input v-model="groupFilters.uid" class="input" placeholder="32045" maxlength="5" inputmode="numeric" @input="onGroupSearchInput('uid')" @keyup.enter="fetchGroups(1)" /></div>
          <div class="field"><label class="field-label">Title</label><input v-model="groupFilters.title" class="input" placeholder="SubnPay" @input="onGroupSearchInput('title')" @keyup.enter="fetchGroups(1)" /></div>
          <div class="field">
            <label class="field-label">Status</label>
            <select v-model="groupFilters.status" class="input">
              <option value="">All</option>
              <option value="active">active</option>
              <option value="banned">banned</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
          <div class="field"><label class="field-label">From</label><input v-model="groupFilters.from" class="input" type="date" /></div>
          <div class="field"><label class="field-label">To</label><input v-model="groupFilters.to" class="input" type="date" /></div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="groupsLoading" @click="fetchGroups(1)">{{ groupsLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="groupsLoading" @click="resetGroupFilters">Reset</button>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <p v-if="groupsError" class="error tbl-error" role="alert">{{ groupsError }}</p>
        <p v-if="!groupsLoading && groups.length === 0 && !groupsError" class="empty tbl-empty">No bot groups found.</p>
        <div v-if="groups.length || groupsLoading" class="tbl-scroll">
          <table class="table">
            <thead>
              <tr><th>UID</th><th>Group ID</th><th>Title</th><th>Username</th><th>Type</th><th>Status</th><th>Balance</th><th>Deposits</th><th>Last Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="g in groups" :key="g.groupId">
                <td class="mono"><span class="badge badge--primary">{{ uidFor(g.groupId, g.uid) }}</span></td>
                <td class="mono">{{ g.groupId }}</td>
                <td>{{ g.title || '—' }}</td>
                <td class="mono">{{ g.username ? '@' + g.username : '—' }}</td>
                <td><span class="badge">{{ g.type || '—' }}</span></td>
                <td><span :class="['badge', statusClass(g.status)]">{{ g.status }}</span></td>
                <td class="mono">{{ money(g.balance) }}</td>
                <td class="mono">{{ g.totalDeposits ?? 0 }}</td>
                <td class="muted">{{ fmt(g.lastActiveAt) }}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm action-btn" type="button" @click="openGroupStatusPopup(g)">Change Status</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="tbl-footer">
          <div class="tbl-footer__summary">
            <span class="tbl-info">{{ paginationSummary(groupTotal, groupPage, 'groups') }}</span>
            <span class="tbl-page-status" aria-live="polite">Page {{ groupPage }} of {{ groupTotalPages || 1 }}</span>
          </div>
          <Pagination class="tbl-pagination" :page="groupPage" :total-pages="groupTotalPages" :disabled="groupsLoading" @change="fetchGroups" />
        </div>
      </div>
    </div>

    <!-- Group Status Popup -->
    <div v-if="groupStatusPopup.open" class="modal-overlay" @click.self="groupStatusPopup.open = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Change Status — {{ groupStatusPopup.group?.groupId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="groupStatusPopup.open = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="status-popup-info">
            <span class="detail-label">Current status</span>
            <span :class="['badge', statusClass(groupStatusPopup.group?.status)]">{{ groupStatusPopup.group?.status }}</span>
          </div>
          <div class="status-popup-actions">
            <button class="btn btn-primary status-action-btn" type="button" @click="openGroupDetail(groupStatusPopup.group); groupStatusPopup.open = false">
              <span class="status-action-icon">👁</span>
              <span class="status-action-text"><strong>View</strong><small>Open group details</small></span>
            </button>
            <button class="btn status-action-btn status-action-btn--adjust" type="button" @click="openAdjust(groupStatusPopup.group); groupStatusPopup.open = false">
              <span class="status-action-icon">💰</span>
              <span class="status-action-text"><strong>Adjust Balance</strong><small>Credit or debit balance</small></span>
            </button>
            <button v-if="groupStatusPopup.group?.status !== 'banned'" class="btn status-action-btn status-action-btn--danger" type="button" @click="openStatus(groupStatusPopup.group, 'ban'); groupStatusPopup.open = false">
              <span class="status-action-icon">🚫</span>
              <span class="status-action-text"><strong>Ban</strong><small>Permanently block group</small></span>
            </button>
            <button v-if="groupStatusPopup.group?.status !== 'suspended'" class="btn status-action-btn status-action-btn--warning" type="button" @click="openStatus(groupStatusPopup.group, 'suspend'); groupStatusPopup.open = false">
              <span class="status-action-icon">⏸</span>
              <span class="status-action-text"><strong>Suspend</strong><small>Temporarily pause group</small></span>
            </button>
            <button v-if="groupStatusPopup.group?.status !== 'active'" class="btn status-action-btn status-action-btn--success" type="button" @click="openStatus(groupStatusPopup.group, 'unban'); groupStatusPopup.open = false">
              <span class="status-action-icon">✅</span>
              <span class="status-action-text"><strong>Unban / Activate</strong><small>Restore group access</small></span>
            </button>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="groupStatusPopup.open = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Transactions -->
    <div v-show="activeTab === 'transactions'" class="tab-panel">
      <div class="card filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">Trn ID</label><input v-model="txnFilters.trnId" class="input" placeholder="BTXN..." @input="onTxnSearchInput('trnId')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field"><label class="field-label">Order ID</label><input v-model="txnFilters.orderId" class="input" placeholder="B2026..." @input="onTxnSearchInput('orderId')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field"><label class="field-label">Group ID</label><input v-model="txnFilters.groupId" class="input" placeholder="-100..." @input="onTxnSearchInput('groupId')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field"><label class="field-label">UID</label><input v-model="txnFilters.uid" class="input" placeholder="32045" maxlength="5" inputmode="numeric" @input="onTxnSearchInput('uid')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field">
            <label class="field-label">Type</label>
            <select v-model="txnFilters.type" class="input">
              <option value="">All</option>
              <option value="credit">credit</option>
              <option value="debit">debit</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Note</label>
            <select v-model="txnFilters.note" class="input">
              <option value="">All</option>
              <option value="deposit">deposit</option>
              <option value="adjustment">adjustment</option>
              <option value="reversal">reversal</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Status</label>
            <select v-model="txnFilters.status" class="input">
              <option value="">All</option>
              <option value="success">success</option>
              <option value="reversed">reversed</option>
            </select>
          </div>
          <div class="field"><label class="field-label">From</label><input v-model="txnFilters.from" class="input" type="date" /></div>
          <div class="field"><label class="field-label">To</label><input v-model="txnFilters.to" class="input" type="date" /></div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="txnsLoading" @click="fetchTransactions(1)">{{ txnsLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="txnsLoading" @click="resetTxnFilters">Reset</button>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <p v-if="txnsError" class="error tbl-error" role="alert">{{ txnsError }}</p>
        <p v-if="!txnsLoading && transactions.length === 0 && !txnsError" class="empty tbl-empty">No bot transactions found.</p>
        <div v-if="transactions.length || txnsLoading" class="tbl-scroll">
          <table class="table">
            <thead>
              <tr><th>Trn ID</th><th>UID</th><th>Group</th><th>Order</th><th>Amount</th><th>Type</th><th>Note</th><th>Balance After</th><th>Status</th><th>Remark</th><th>Created</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in transactions" :key="t.trnId">
                <td class="mono">{{ t.trnId }}</td>
                <td class="mono"><span class="badge badge--primary">{{ uidFor(t.groupId, t.uid) }}</span></td>
                <td class="mono">{{ t.groupId }}</td>
                <td class="mono">{{ t.orderId || '—' }}</td>
                <td class="mono">{{ money(t.amount) }}</td>
                <td><span :class="['badge', t.type === 'credit' ? 'badge--success' : 'badge--danger']">{{ t.type }}</span></td>
                <td><span class="badge">{{ t.note }}</span></td>
                <td class="mono">{{ money(t.balanceAfter) }}</td>
                <td><span :class="['badge', statusClass(t.status)]">{{ t.status }}</span></td>
                <td class="muted remark">{{ t.remark || '—' }}</td>
                <td class="muted">{{ fmt(t.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="tbl-footer">
          <div class="tbl-footer__summary">
            <span class="tbl-info">{{ paginationSummary(txnTotal, txnPage, 'transactions') }}</span>
            <span class="tbl-page-status" aria-live="polite">Page {{ txnPage }} of {{ txnTotalPages || 1 }}</span>
          </div>
          <Pagination class="tbl-pagination" :page="txnPage" :total-pages="txnTotalPages" :disabled="txnsLoading" @change="fetchTransactions" />
        </div>
      </div>
    </div>

    <!-- Deposit Records (orders) -->
    <div v-show="activeTab === 'orders'" class="tab-panel">
      <div class="card filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">Order ID</label><input v-model="orderFilters.orderId" class="input" placeholder="B2026..." @input="onOrderSearchInput('orderId')" @keyup.enter="fetchOrders(1)" /></div>
          <div class="field"><label class="field-label">Group ID</label><input v-model="orderFilters.groupId" class="input" placeholder="-100..." @input="onOrderSearchInput('groupId')" @keyup.enter="fetchOrders(1)" /></div>
          <div class="field"><label class="field-label">UID</label><input v-model="orderFilters.uid" class="input" placeholder="32045" maxlength="5" inputmode="numeric" @input="onOrderSearchInput('uid')" @keyup.enter="fetchOrders(1)" /></div>
          <div class="field">
            <label class="field-label">Status</label>
            <select v-model="orderFilters.status" class="input">
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="success">success</option>
              <option value="failed">failed</option>
              <option value="expired">expired</option>
              <option value="reversed">reversed</option>
            </select>
          </div>
          <div class="field"><label class="field-label">From</label><input v-model="orderFilters.from" class="input" type="date" /></div>
          <div class="field"><label class="field-label">To</label><input v-model="orderFilters.to" class="input" type="date" /></div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="ordersLoading" @click="fetchOrders(1)">{{ ordersLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="ordersLoading" @click="resetOrderFilters">Reset</button>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <p v-if="ordersError" class="error tbl-error" role="alert">{{ ordersError }}</p>
        <p v-if="!ordersLoading && orders.length === 0 && !ordersError" class="empty tbl-empty">No deposit records found.</p>
        <div v-if="orders.length || ordersLoading" class="tbl-scroll">
          <table class="table table--wide">
            <thead>
              <tr><th>Order ID</th><th>UID</th><th>Group</th><th>Amount</th><th>Received</th><th>Status</th><th>UPI ID</th><th>SimplyPay No</th><th>Trn ID</th><th>Requested By</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="o in orders" :key="o.orderId">
                <td class="mono">{{ o.orderId }}</td>
                <td class="mono"><span class="badge badge--primary">{{ uidFor(o.groupId) }}</span></td>
                <td class="mono">{{ o.groupId }}</td>
                <td class="mono">{{ money(o.amount) }}</td>
                <td class="mono">{{ money(o.receivedAmount) }}</td>
                <td><span :class="['badge', statusClass(o.status)]">{{ o.status }}</span></td>
                <td class="mono">{{ o.upiId || '—' }}</td>
                <td class="mono">{{ o.simplypayOrderNo || '—' }}</td>
                <td class="mono">{{ o.trnId || '—' }}</td>
                <td class="mono">{{ o.requestedBy || '—' }}</td>
                <td class="muted">{{ fmt(o.createdAt) }}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm action-btn" type="button" @click="openOrderDetail(o)">View</button>
                    <button v-if="o.status === 'pending'" class="btn btn-sm action-btn action-btn--success" type="button" @click="openOrderAction(o, 'approve')">Approve</button>
                    <button v-if="o.status === 'pending'" class="btn btn-sm action-btn action-btn--danger" type="button" @click="openOrderAction(o, 'reject')">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="tbl-footer">
          <div class="tbl-footer__summary">
            <span class="tbl-info">{{ paginationSummary(orderTotal, orderPage, 'records') }}</span>
            <span class="tbl-page-status" aria-live="polite">Page {{ orderPage }} of {{ orderTotalPages || 1 }}</span>
          </div>
          <Pagination class="tbl-pagination" :page="orderPage" :total-pages="orderTotalPages" :disabled="ordersLoading" @change="fetchOrders" />
        </div>
      </div>
    </div>

    <!-- Group detail modal -->
    <div v-if="detail.open" class="modal-overlay" @click.self="detail.open = false">
      <div class="modal modal--wide" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Group — {{ detail.groupId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="detail.open = false">✕</button>
        </div>
        <div class="modal-body modal-body--scroll">
          <p v-if="detail.error" class="error" role="alert">{{ detail.error }}</p>
          <p v-if="detail.loading" class="empty">Loading…</p>
          <template v-else-if="detail.group">
            <div class="stats-grid">
              <div class="stat"><span class="stat-label">Balance</span><span class="stat-value">{{ money(detail.group.balance) }}</span></div>
              <div class="stat"><span class="stat-label">Status</span><span class="stat-value stat-value--sm"><span :class="['badge', statusClass(detail.group.status)]">{{ detail.group.status }}</span></span></div>
              <div class="stat"><span class="stat-label">Total Deposits</span><span class="stat-value">{{ detail.group.totalDeposits ?? 0 }}</span></div>
              <div class="stat"><span class="stat-label">Total Credited</span><span class="stat-value">{{ money(detail.group.totalCredited) }}</span></div>
              <div class="stat"><span class="stat-label">Total Failed</span><span class="stat-value">{{ detail.group.totalFailed ?? 0 }}</span></div>
            </div>

            <div class="detail-grid">
              <div><span class="detail-label">UID</span><span><span class="badge badge--primary">{{ uidFor(detail.group.groupId, detail.group.uid) }}</span></span></div>
              <div><span class="detail-label">Title</span><span>{{ detail.group.title || '—' }}</span></div>
              <div><span class="detail-label">Username</span><span class="mono">{{ detail.group.username ? '@' + detail.group.username : '—' }}</span></div>
              <div><span class="detail-label">Type</span><span>{{ detail.group.type || '—' }}</span></div>
              <div><span class="detail-label">Registered By</span><span class="mono">{{ detail.group.registeredBy || '—' }}</span></div>
              <div><span class="detail-label">Created</span><span>{{ fmt(detail.group.createdAt) }}</span></div>
              <div><span class="detail-label">Last Active</span><span>{{ fmt(detail.group.lastActiveAt) }}</span></div>
              <div><span class="detail-label">Status Remark</span><span>{{ detail.group.statusRemark || '—' }}</span></div>
              <div><span class="detail-label">Status Updated By</span><span class="mono">{{ detail.group.statusUpdatedBy || '—' }}</span></div>
            </div>

            <h4 class="section-heading">Order counts</h4>
            <div class="stats-grid">
              <div v-for="(value, key) in detail.counts" :key="key" class="stat">
                <span class="stat-label">{{ key }}</span>
                <span class="stat-value">{{ value ?? 0 }}</span>
              </div>
            </div>

            <h4 class="section-heading">
              Stats
              <span class="window-toggle">
                <button :class="['btn btn-sm', detail.window === 'today' ? 'btn-primary' : 'btn-ghost']" type="button" :disabled="detail.statsLoading" @click="fetchGroupStats('today')">Today</button>
                <button :class="['btn btn-sm', detail.window === 'all' ? 'btn-primary' : 'btn-ghost']" type="button" :disabled="detail.statsLoading" @click="fetchGroupStats('all')">All</button>
              </span>
            </h4>
            <p v-if="detail.statsLoading" class="empty">Loading stats…</p>
            <div v-else-if="detail.stats" class="stats-grid">
              <template v-if="statsBucket(detail.stats)">
                <div class="stat"><span class="stat-label">Total Orders</span><span class="stat-value">{{ statsBucket(detail.stats).totalOrders ?? 0 }}</span></div>
                <div class="stat"><span class="stat-label">Total Amount</span><span class="stat-value">{{ money(statsBucket(detail.stats).totalAmount) }}</span></div>
                <div class="stat"><span class="stat-label">Success</span><span class="stat-value">{{ statsBucket(detail.stats).success?.count ?? 0 }} <small class="muted">{{ money(statsBucket(detail.stats).success?.amount) }}</small></span></div>
                <div class="stat"><span class="stat-label">Pending</span><span class="stat-value">{{ statsBucket(detail.stats).pending?.count ?? 0 }} <small class="muted">{{ money(statsBucket(detail.stats).pending?.amount) }}</small></span></div>
                <div class="stat"><span class="stat-label">Failed</span><span class="stat-value">{{ statsBucket(detail.stats).failed?.count ?? 0 }} <small class="muted">{{ money(statsBucket(detail.stats).failed?.amount) }}</small></span></div>
                <div class="stat"><span class="stat-label">Expired</span><span class="stat-value">{{ statsBucket(detail.stats).expired?.count ?? 0 }} <small class="muted">{{ money(statsBucket(detail.stats).expired?.amount) }}</small></span></div>
                <div class="stat"><span class="stat-label">Reversed</span><span class="stat-value">{{ statsBucket(detail.stats).reversed?.count ?? 0 }} <small class="muted">{{ money(statsBucket(detail.stats).reversed?.amount) }}</small></span></div>
              </template>
            </div>

            <h4 class="section-heading">Recent orders</h4>
            <p v-if="detail.recentOrders.length === 0" class="empty">No recent orders.</p>
            <div v-else class="table-wrap">
              <table class="table table--compact">
                <thead><tr><th>Order ID</th><th>UID</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  <tr v-for="o in detail.recentOrders" :key="o.orderId">
                    <td class="mono">{{ o.orderId }}</td>
                    <td class="mono"><span class="badge badge--primary">{{ uidFor(o.groupId || detail.groupId, o.uid) }}</span></td>
                    <td class="mono">{{ money(o.amount) }}</td>
                    <td><span :class="['badge', statusClass(o.status)]">{{ o.status }}</span></td>
                    <td class="muted">{{ fmt(o.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 class="section-heading">Status history</h4>
            <p v-if="detail.history.length === 0" class="empty">No status changes yet.</p>
            <ul v-else class="history-list">
              <li v-for="(h, i) in detail.history" :key="i">
                <span :class="['badge', statusClass(h.status)]">{{ h.status }}</span>
                <span class="history-remark">{{ h.remark || '—' }}</span>
                <span class="muted">{{ fmt(h.changedAt) }} • by {{ h.changedBy }}</span>
              </li>
            </ul>
          </template>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="detail.open = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Group status modal -->
    <div v-if="statusDialog.open" class="modal-overlay" @click.self="statusDialog.open = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>{{ statusMeta[statusDialog.action].label }} group — {{ statusDialog.groupId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="statusDialog.open = false">✕</button>
        </div>
        <div class="modal-body">
          <p v-if="statusDialog.error" class="error" role="alert">{{ statusDialog.error }}</p>
          <div class="field">
            <label class="field-label">Remark <span class="required">*</span></label>
            <textarea v-model="statusDialog.remark" class="input" rows="3" :placeholder="statusMeta[statusDialog.action].placeholder"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="statusDialog.open = false">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="statusDialog.loading" @click="submitStatus">{{ statusDialog.loading ? 'Saving…' : statusMeta[statusDialog.action].label }}</button>
        </div>
      </div>
    </div>

    <!-- Adjust balance modal -->
    <div v-if="adjustDialog.open" class="modal-overlay" @click.self="adjustDialog.open = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Adjust balance — {{ adjustDialog.groupId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="adjustDialog.open = false">✕</button>
        </div>
        <div class="modal-body">
          <p v-if="adjustDialog.error" class="error" role="alert">{{ adjustDialog.error }}</p>
          <div class="field">
            <label class="field-label">Amount <span class="required">*</span></label>
            <input v-model="adjustDialog.amount" class="input" type="number" min="0.01" step="0.01" placeholder="500" />
          </div>
          <div class="field">
            <label class="field-label">Type <span class="required">*</span></label>
            <select v-model="adjustDialog.type" class="input">
              <option value="credit">credit</option>
              <option value="debit">debit</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Remark <span class="required">*</span></label>
            <textarea v-model="adjustDialog.remark" class="input" rows="3" placeholder="Manual top-up"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="adjustDialog.open = false">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="adjustDialog.loading" @click="submitAdjust">{{ adjustDialog.loading ? 'Saving…' : 'Adjust balance' }}</button>
        </div>
      </div>
    </div>

    <!-- Order detail modal -->
    <div v-if="orderDetail.open" class="modal-overlay" @click.self="orderDetail.open = false">
      <div class="modal modal--wide" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Deposit — {{ orderDetail.orderId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="orderDetail.open = false">✕</button>
        </div>
        <div class="modal-body modal-body--scroll">
          <p v-if="orderDetail.error" class="error" role="alert">{{ orderDetail.error }}</p>
          <p v-if="orderDetail.loading" class="empty">Loading…</p>
          <template v-else-if="orderDetail.order">
            <div class="detail-grid">
              <div><span class="detail-label">Status</span><span><span :class="['badge', statusClass(orderDetail.order.status)]">{{ orderDetail.order.status }}</span></span></div>
              <div><span class="detail-label">Group</span><span class="mono">{{ orderDetail.order.groupId }}</span></div>
              <div><span class="detail-label">UID</span><span class="mono">{{ uidFor(orderDetail.order.groupId, orderDetail.transaction?.uid) }}</span></div>
              <div><span class="detail-label">Amount</span><span class="mono">{{ money(orderDetail.order.amount) }}</span></div>
              <div><span class="detail-label">Received</span><span class="mono">{{ money(orderDetail.order.receivedAmount) }}</span></div>
              <div><span class="detail-label">UPI ID</span><span class="mono">{{ orderDetail.order.upiId || '—' }}</span></div>
              <div><span class="detail-label">SimplyPay No</span><span class="mono">{{ orderDetail.order.simplypayOrderNo || '—' }}</span></div>
              <div><span class="detail-label">Trn ID</span><span class="mono">{{ orderDetail.order.trnId || '—' }}</span></div>
              <div><span class="detail-label">Requested By</span><span class="mono">{{ orderDetail.order.requestedBy || '—' }}</span></div>
              <div><span class="detail-label">Created</span><span>{{ fmt(orderDetail.order.createdAt) }}</span></div>
              <div><span class="detail-label">Paid At</span><span>{{ fmt(orderDetail.order.paidAt) }}</span></div>
              <div class="detail-full"><span class="detail-label">Remark</span><span>{{ orderDetail.order.remark || '—' }}</span></div>
              <div class="detail-full"><span class="detail-label">Deep Link</span><span class="mono break">{{ orderDetail.order.deepLink || '—' }}</span></div>
              <div class="detail-full"><span class="detail-label">Payment Link</span><span class="mono break">{{ orderDetail.order.paymentLink || '—' }}</span></div>
            </div>

            <h4 class="section-heading">Transaction</h4>
            <p v-if="!orderDetail.transaction" class="empty">No transaction — this order has not been credited.</p>
            <div v-else class="detail-grid">
              <div><span class="detail-label">Trn ID</span><span class="mono">{{ orderDetail.transaction.trnId }}</span></div>
              <div><span class="detail-label">Type</span><span class="badge">{{ orderDetail.transaction.type }}</span></div>
              <div><span class="detail-label">Note</span><span class="badge">{{ orderDetail.transaction.note }}</span></div>
              <div><span class="detail-label">Amount</span><span class="mono">{{ money(orderDetail.transaction.amount) }}</span></div>
              <div><span class="detail-label">Balance After</span><span class="mono">{{ money(orderDetail.transaction.balanceAfter) }}</span></div>
              <div><span class="detail-label">Status</span><span :class="['badge', statusClass(orderDetail.transaction.status)]">{{ orderDetail.transaction.status }}</span></div>
              <div class="detail-full"><span class="detail-label">Remark</span><span>{{ orderDetail.transaction.remark || '—' }}</span></div>
              <div><span class="detail-label">Created</span><span>{{ fmt(orderDetail.transaction.createdAt) }}</span></div>
            </div>
          </template>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="orderDetail.open = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Order action modal -->
    <div v-if="orderAction.open" class="modal-overlay" @click.self="orderAction.open = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>{{ orderAction.mode === 'approve' ? 'Approve' : 'Reject' }} order — {{ orderAction.orderId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="orderAction.open = false">✕</button>
        </div>
        <div class="modal-body">
          <p v-if="orderAction.error" class="error" role="alert">{{ orderAction.error }}</p>
          <p v-if="orderAction.mode === 'approve'" class="muted">This will credit the order amount to the group balance.</p>
          <div v-else class="field">
            <label class="field-label">Remark (optional)</label>
            <textarea v-model="orderAction.remark" class="input" rows="3" placeholder="Payment not received"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="orderAction.open = false">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="orderAction.loading" @click="submitOrderAction">{{ orderAction.loading ? 'Saving…' : (orderAction.mode === 'approve' ? 'Approve' : 'Reject') }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import Pagination from '../components/Pagination.vue'
import { useToast } from '../composables/useToast.js'
import { fmtDateTime as fmt } from '../utils/format.js'
import {
  getBotGroups, getBotGroup, banBotGroup, suspendBotGroup, unbanBotGroup, adjustBotGroupBalance,
  getBotOrders, getBotOrder, approveBotOrder, rejectBotOrder,
  getBotTransactions, getBotGroupStats,
} from '../api/client.js'

const toast = useToast()
const activeTab = ref('groups')
const BOT_PAGE_SIZE = 20

function paginationSummary(total, page, label) {
  const count = Number(total) || 0
  if (!count) return `Showing 0 ${label}`

  const start = (Math.max(1, page) - 1) * BOT_PAGE_SIZE + 1
  const end = Math.min(start + BOT_PAGE_SIZE - 1, count)
  return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${count.toLocaleString()} ${label}`
}

// The orders endpoint does not return uid, so keep a groupId → uid cache
// built from every group payload we receive.
const groupUidMap = reactive({})

function rememberGroups(list) {
  (list || []).forEach((g) => {
    if (g && g.groupId && g.uid) groupUidMap[g.groupId] = String(g.uid)
  })
}

function uidFor(groupId, uid) {
  return uid || (groupId ? groupUidMap[groupId] : '') || '—'
}

async function loadAllGroupUids() {
  try {
    let page = 1
    let totalPages = 1
    do {
      const res = await getBotGroups({ page, limit: 100 })
      rememberGroups(res.data)
      totalPages = res.meta?.totalPages || 1
      page += 1
    } while (page <= totalPages && page <= 10)
  } catch {
    // UID lookup is best-effort; the tables still render without it.
  }
}

// — Groups —
const groups = ref([])
const groupFilters = reactive({ groupId: '', uid: '', title: '', status: '', from: '', to: '' })

function onGroupSearchInput(field) {
  if (groupFilters[field].trim()) {
    for (const key of ['groupId', 'uid', 'title']) {
      if (key !== field) groupFilters[key] = ''
    }
  }
}

// — Group status popup (single "Change Status" button) —
const groupStatusPopup = reactive({ open: false, group: null })

function openGroupStatusPopup(g) {
  groupStatusPopup.group = g
  groupStatusPopup.open = true
}
const groupPage = ref(1)
const groupTotal = ref(0)
const groupTotalPages = ref(1)
const groupsLoading = ref(false)
const groupsError = ref('')

async function fetchGroups(p = 1) {
  const uid = groupFilters.uid.trim()
  if (uid && !/^\d{5}$/.test(uid)) {
    groupsError.value = 'UID must be a 5 digit number'
    toast.error(groupsError.value)
    return
  }
  groupsLoading.value = true
  groupsError.value = ''
  try {
    const res = await getBotGroups({
      groupId: groupFilters.groupId.trim(),
      uid,
      title: groupFilters.title.trim(),
      status: groupFilters.status,
      from: groupFilters.from,
      to: groupFilters.to,
      page: p,
      limit: BOT_PAGE_SIZE,
    })
    groups.value = res.data || []
    rememberGroups(groups.value)
    groupPage.value = res.meta?.page || p
    groupTotal.value = res.meta?.total || 0
    groupTotalPages.value = res.meta?.totalPages || 1
  } catch (e) {
    groupsError.value = e.message
    toast.error(e.message)
  } finally {
    groupsLoading.value = false
  }
}

function resetGroupFilters() {
  Object.assign(groupFilters, { groupId: '', uid: '', title: '', status: '', from: '', to: '' })
  fetchGroups(1)
}

// — Group detail —
const detail = reactive({
  open: false, loading: false, error: '', groupId: '',
  group: null, history: [], counts: {}, recentOrders: [], stats: null, window: 'all', statsLoading: false,
})

async function openGroupDetail(g) {
  Object.assign(detail, {
    open: true, loading: true, error: '', groupId: g.groupId,
    group: null, history: [], counts: {}, recentOrders: [], stats: null, window: 'all',
  })
  try {
    const res = await getBotGroup(g.groupId)
    detail.group = res.data?.group || null
    if (detail.group) rememberGroups([detail.group])
    detail.history = res.data?.statusHistory || []
    detail.counts = res.data?.counts || {}
    detail.recentOrders = res.data?.recentOrders || []
  } catch (e) {
    detail.error = e.message
  } finally {
    detail.loading = false
  }
  fetchGroupStats('all')
}

async function fetchGroupStats(win) {
  if (!detail.groupId) return
  detail.window = win
  detail.statsLoading = true
  try {
    detail.stats = await getBotGroupStats(detail.groupId, win)
  } catch (e) {
    toast.error(e.message)
  } finally {
    detail.statsLoading = false
  }
}

function statsBucket(stats) {
  return stats ? stats[detail.window] : null
}

// — Status change —
const statusDialog = reactive({ open: false, groupId: '', action: '', remark: '', loading: false, error: '' })
const statusMeta = {
  ban: { label: 'Ban', placeholder: 'Chargeback abuse', done: 'Group banned' },
  suspend: { label: 'Suspend', placeholder: 'Under review', done: 'Group suspended' },
  unban: { label: 'Unban', placeholder: 'Appeal accepted', done: 'Group unbanned' },
}

function openStatus(g, action) {
  Object.assign(statusDialog, { open: true, groupId: g.groupId, action, remark: '', loading: false, error: '' })
}

async function submitStatus() {
  if (!statusDialog.remark.trim()) {
    statusDialog.error = 'Remark is required'
    return
  }
  statusDialog.loading = true
  statusDialog.error = ''
  try {
    const fn = statusDialog.action === 'ban' ? banBotGroup : statusDialog.action === 'suspend' ? suspendBotGroup : unbanBotGroup
    const res = await fn(statusDialog.groupId, statusDialog.remark.trim())
    toast.success(res.msg || statusMeta[statusDialog.action].done)
    statusDialog.open = false
    fetchGroups(groupPage.value)
    if (detail.open && detail.groupId === statusDialog.groupId) openGroupDetail({ groupId: detail.groupId })
  } catch (e) {
    statusDialog.error = e.message
    toast.error(e.message)
  } finally {
    statusDialog.loading = false
  }
}

// — Balance adjustment —
const adjustDialog = reactive({ open: false, groupId: '', amount: '', type: 'credit', remark: '', loading: false, error: '' })

function openAdjust(g) {
  Object.assign(adjustDialog, { open: true, groupId: g.groupId, amount: '', type: 'credit', remark: '', loading: false, error: '' })
}

async function submitAdjust() {
  const amount = Number(adjustDialog.amount)
  if (!isFinite(amount) || amount <= 0) {
    adjustDialog.error = 'Amount must be greater than 0'
    return
  }
  if (!adjustDialog.remark.trim()) {
    adjustDialog.error = 'Remark is required'
    return
  }
  adjustDialog.loading = true
  adjustDialog.error = ''
  try {
    const res = await adjustBotGroupBalance(adjustDialog.groupId, {
      amount,
      type: adjustDialog.type,
      remark: adjustDialog.remark.trim(),
    })
    toast.success(res.msg || `Balance ${adjustDialog.type === 'credit' ? 'credited' : 'debited'} (${res.trnId || 'done'})`)
    adjustDialog.open = false
    fetchGroups(groupPage.value)
    if (detail.open && detail.groupId === adjustDialog.groupId) openGroupDetail({ groupId: detail.groupId })
  } catch (e) {
    adjustDialog.error = e.message
    toast.error(e.message)
  } finally {
    adjustDialog.loading = false
  }
}

// — Transactions —
const transactions = ref([])
const txnFilters = reactive({ trnId: '', orderId: '', groupId: '', uid: '', type: '', note: '', status: '', from: '', to: '' })
function onTxnSearchInput(field) {
  if (txnFilters[field].trim()) {
    for (const key of ['trnId', 'orderId', 'groupId', 'uid']) {
      if (key !== field) txnFilters[key] = ''
    }
  }
}
const txnPage = ref(1)
const txnTotal = ref(0)
const txnTotalPages = ref(1)
const txnsLoading = ref(false)
const txnsError = ref('')

async function fetchTransactions(p = 1) {
  const uid = txnFilters.uid.trim()
  if (uid && !/^\d{5}$/.test(uid)) {
    txnsError.value = 'UID must be a 5 digit number'
    toast.error(txnsError.value)
    return
  }
  txnsLoading.value = true
  txnsError.value = ''
  try {
    const res = await getBotTransactions({
      trnId: txnFilters.trnId.trim(),
      orderId: txnFilters.orderId.trim(),
      groupId: txnFilters.groupId.trim(),
      uid,
      type: txnFilters.type,
      note: txnFilters.note,
      status: txnFilters.status,
      from: txnFilters.from,
      to: txnFilters.to,
      page: p,
      limit: BOT_PAGE_SIZE,
    })
    transactions.value = res.data || []
    rememberGroups(transactions.value.map((t) => ({ groupId: t.groupId, uid: t.uid })))
    txnPage.value = res.meta?.page || p
    txnTotal.value = res.meta?.total || 0
    txnTotalPages.value = res.meta?.totalPages || 1
  } catch (e) {
    txnsError.value = e.message
    toast.error(e.message)
  } finally {
    txnsLoading.value = false
  }
}

function resetTxnFilters() {
  Object.assign(txnFilters, { trnId: '', orderId: '', groupId: '', uid: '', type: '', note: '', status: '', from: '', to: '' })
  fetchTransactions(1)
}

// — Orders (deposit records) —
const orders = ref([])
const orderFilters = reactive({ orderId: '', groupId: '', uid: '', status: '', from: '', to: '' })

function onOrderSearchInput(field) {
  if (orderFilters[field].trim()) {
    for (const key of ['orderId', 'groupId', 'uid']) {
      if (key !== field) orderFilters[key] = ''
    }
  }
}
const orderPage = ref(1)
const orderTotal = ref(0)
const orderTotalPages = ref(1)
const ordersLoading = ref(false)
const ordersError = ref('')

async function fetchOrders(p = 1) {
  const uid = orderFilters.uid.trim()
  if (uid && !/^\d{5}$/.test(uid)) {
    ordersError.value = 'UID must be a 5 digit number'
    toast.error(ordersError.value)
    return
  }
  ordersLoading.value = true
  ordersError.value = ''
  try {
    let groupId = orderFilters.groupId.trim()
    // The orders endpoint has no uid filter, so resolve it to a groupId first.
    if (uid && !groupId) {
      const gres = await getBotGroups({ uid, limit: 1 })
      const match = (gres.data || [])[0]
      rememberGroups(gres.data)
      if (!match) {
        orders.value = []
        orderPage.value = 1
        orderTotal.value = 0
        orderTotalPages.value = 1
        ordersError.value = `No group found for UID ${uid}`
        return
      }
      groupId = match.groupId
    }
    const res = await getBotOrders({
      orderId: orderFilters.orderId.trim(),
      groupId,
      status: orderFilters.status,
      from: orderFilters.from,
      to: orderFilters.to,
      page: p,
      limit: BOT_PAGE_SIZE,
    })
    orders.value = res.data || []
    orderPage.value = res.meta?.page || p
    orderTotal.value = res.meta?.total || 0
    orderTotalPages.value = res.meta?.totalPages || 1
  } catch (e) {
    ordersError.value = e.message
    toast.error(e.message)
  } finally {
    ordersLoading.value = false
  }
}

function resetOrderFilters() {
  Object.assign(orderFilters, { orderId: '', groupId: '', uid: '', status: '', from: '', to: '' })
  fetchOrders(1)
}

// — Order detail —
const orderDetail = reactive({ open: false, loading: false, error: '', orderId: '', order: null, transaction: null })

async function openOrderDetail(o) {
  Object.assign(orderDetail, { open: true, loading: true, error: '', orderId: o.orderId, order: null, transaction: null })
  try {
    const res = await getBotOrder(o.orderId)
    orderDetail.order = res.data?.order || null
    orderDetail.transaction = res.data?.transaction || null
  } catch (e) {
    orderDetail.error = e.message
    toast.error(e.message)
  } finally {
    orderDetail.loading = false
  }
}

// — Order approve / reject —
const orderAction = reactive({ open: false, mode: '', orderId: '', remark: '', loading: false, error: '' })

function openOrderAction(o, mode) {
  Object.assign(orderAction, { open: true, mode, orderId: o.orderId, remark: '', loading: false, error: '' })
}

async function submitOrderAction() {
  orderAction.loading = true
  orderAction.error = ''
  try {
    if (orderAction.mode === 'approve') {
      const res = await approveBotOrder(orderAction.orderId)
      toast.success(res.msg || 'Order approved and credited')
    } else {
      const res = await rejectBotOrder(orderAction.orderId, orderAction.remark.trim())
      toast.success(res.msg || 'Order rejected')
    }
    orderAction.open = false
    fetchOrders(orderPage.value)
    if (orderDetail.open && orderDetail.orderId === orderAction.orderId) {
      openOrderDetail({ orderId: orderDetail.orderId })
    }
  } catch (e) {
    orderAction.error = e.message
    toast.error(e.message)
  } finally {
    orderAction.loading = false
  }
}

// — Helpers —
function statusClass(s) {
  switch (s) {
    case 'active':
    case 'success':
      return 'badge--success'
    case 'pending':
    case 'suspended':
      return 'badge--warning'
    case 'banned':
    case 'failed':
      return 'badge--danger'
    case 'expired':
    case 'reversed':
      return 'badge--primary'
    default:
      return ''
  }
}

function money(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (!isFinite(n)) return String(v)
  return n.toLocaleString('en-IN')
}

onMounted(() => {
  fetchGroups(1)
  fetchTransactions(1)
  fetchOrders(1)
  loadAllGroupUids()
})
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap}
.card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}

/* Table card — no padding so scroll + footer hug the border */
.table-card{padding:0;display:flex;flex-direction:column;overflow:hidden}
.tbl-scroll{overflow-x:auto;overflow-y:visible;flex:1;-webkit-overflow-scrolling:touch}
/* Keep the horizontal scrollbar right above the footer (not at page bottom) */
.tbl-scroll::-webkit-scrollbar{height:6px}
.tbl-scroll::-webkit-scrollbar-track{background:transparent}
.tbl-scroll::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:3px}
.tbl-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:12px 14px;border-top:1px solid var(--color-border);background:var(--color-surface-raised)}
.tbl-footer__summary{display:flex;flex-direction:column;gap:4px;min-width:0}
.tbl-info{font-size:12px;color:var(--color-text);font-weight:600;white-space:nowrap}
.tbl-page-status{font-size:11px;color:var(--color-text-secondary)}
.tbl-footer :deep(.pagination){justify-content:flex-end;gap:6px}
.tbl-footer :deep(.pagination > .btn){width:36px;height:36px;min-height:36px;padding:0;border:1px solid var(--color-control-border);border-radius:var(--radius-sm);background:var(--color-control-bg);color:var(--color-text)}
.tbl-footer :deep(.pagination > .btn:hover:not(:disabled)){border-color:var(--color-primary);color:var(--color-primary)}
.tbl-footer :deep(.pagination > .page-btn){min-width:36px;min-height:36px}
.tbl-footer :deep(.pagination > .page-btn.active){background:var(--color-button-primary-bg);border-color:var(--color-button-primary-bg);color:var(--color-button-primary-text)}
.tbl-error{padding:12px 14px;margin:0}
.tbl-empty{padding:20px 14px;margin:0}

.tabs{display:flex;gap:0;border-bottom:1px solid var(--color-border)}
.tab{padding:10px 18px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--color-text-secondary);font-size:var(--text-h4);font-weight:500;cursor:pointer;transition:color .15s ease,border-color .15s ease}
.tab:hover{color:var(--color-text)}
.tab--active{color:var(--color-primary);border-bottom-color:var(--color-primary)}
.tab-panel{display:flex;flex-direction:column;gap:16px}
.filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-bottom:12px}
.filter-row .field{flex:1;min-width:120px;gap:4px}
.filter-row .field-label{font-size:11px}
.filter-row .input{padding:6px 10px;font-size:12px}
.filter-actions{display:flex;gap:6px}
.filters .filter-row{margin-bottom:0}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px}
.empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md)}
.table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:760px}
.table--wide{min-width:1150px}
.table--compact{min-width:0}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top}
.table th{background:var(--color-surface-raised);font-weight:600;white-space:nowrap;position:sticky;top:0;z-index:1}
.mono{font-family:ui-monospace,monospace;font-size:12px}
.break{word-break:break-all}
.muted{color:var(--color-text-secondary);font-size:11px}
.remark{max-width:180px;word-break:break-word}
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap}
.badge--success{background:var(--color-success);color:#fff}
.badge--danger{background:var(--color-danger);color:#fff}
.badge--warning{background:var(--color-warning);color:#fff}
.badge--primary{background:var(--color-primary);color:#fff}
.row-actions{display:flex;gap:4px;flex-wrap:wrap}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.stat{display:flex;flex-direction:column;gap:4px;padding:12px;background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:var(--radius-md)}
.stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--color-text-secondary)}
.stat-value{font-size:20px;font-weight:700}
.stat-value--sm{font-size:13px}
.detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px 18px;font-size:var(--text-h4)}
.detail-grid>div{display:flex;flex-direction:column;gap:2px;min-width:0}
.detail-full{grid-column:1 / -1}
.detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:var(--color-text-secondary)}
.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:var(--text-h3);font-weight:700;margin-top:6px;padding-bottom:8px;border-bottom:1px solid var(--color-border)}
.window-toggle{display:inline-flex;gap:4px}
.history-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;font-size:var(--text-h4)}
.history-list li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 10px;background:var(--color-surface-raised);border-radius:var(--radius-sm)}
.history-remark{flex:1;min-width:120px}
.field{display:flex;flex-direction:column;gap:6px}
.field-label{font-size:12px;font-weight:600;color:var(--color-text-secondary);margin-bottom:0}
.required{color:var(--color-danger);margin-left:4px}
.modal-overlay{position:fixed;inset:0;background:rgba(15,18,24,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-dropdown);width:100%;max-width:440px;display:flex;flex-direction:column;max-height:90vh}
.modal--wide{max-width:860px}
.modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--color-border)}
.modal-head h3{font-size:var(--text-h3);word-break:break-all}
.modal-body{padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
.modal-body--scroll{max-height:calc(90vh - 120px)}
.modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 16px;border-top:1px solid var(--color-border)}
.modal textarea{resize:vertical;font-family:inherit}
.status-popup-info{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--color-surface-raised);border-radius:var(--radius-sm);border:1px solid var(--color-border)}
.status-popup-actions{display:flex;flex-direction:column;gap:8px}
.status-action-btn{display:flex;align-items:center;gap:12px;padding:10px 14px;width:100%;text-align:left;border-radius:var(--radius-sm);transition:opacity .15s}
.status-action-btn:hover{opacity:.85}
.status-action-btn--danger{background:var(--color-button-danger-bg);color:var(--color-button-danger-text);border-color:var(--color-button-danger-bg)}
.status-action-btn--warning{background:var(--color-button-warning-bg);color:var(--color-button-warning-text);border-color:var(--color-button-warning-bg)}
.status-action-btn--success{background:var(--color-button-success-bg);color:var(--color-button-success-text);border-color:var(--color-button-success-bg)}
.status-action-btn--adjust{background:var(--color-button-adjust-bg);color:var(--color-button-adjust-text);border-color:var(--color-button-adjust-bg)}
.status-action-icon{font-size:18px;flex-shrink:0;line-height:1}
.status-action-text{display:flex;flex-direction:column;gap:1px;line-height:1.3}
.status-action-text strong{font-size:13px;font-weight:600}
.status-action-text small{font-size:11px;opacity:.8}
@media(max-width:640px){
  .tbl-footer{align-items:stretch;gap:10px;padding:12px}
  .tbl-footer :deep(.pagination){justify-content:flex-start}
  .tbl-footer :deep(.pagination > button[aria-label="First page"]),
  .tbl-footer :deep(.pagination > button[aria-label="Last page"]),
  .tbl-footer :deep(.pagination > .page-btn:not(.active)),
  .tbl-footer :deep(.pagination > .page-dots){display:none}
}
</style>
