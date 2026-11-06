<template>
  <section class="page">
    <PageTabs v-model="activeTab" :tabs="[{ value: 'groups', label: 'Groups' }, { value: 'transactions', label: 'Transactions' }, { value: 'orders', label: 'Deposit Records' }, { value: 'payout', label: 'Payout' }]" />

    <!-- Groups -->
    <div v-show="activeTab === 'groups'" class="tab-panel">
      <FilterCard v-model="groupFiltersOpen" title="Group filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">Group ID</label><input v-model="groupFilters.groupId" class="input" placeholder="Please enter group ID to search" @input="onGroupSearchInput('groupId')" @keyup.enter="fetchGroups(1)" /></div>
          <div class="field"><label class="field-label">UID</label><input v-model="groupFilters.uid" class="input" placeholder="Please enter UID to search" maxlength="5" inputmode="numeric" @input="onGroupSearchInput('uid')" @keyup.enter="fetchGroups(1)" /></div>
          <div class="field"><label class="field-label">Title</label><input v-model="groupFilters.title" class="input" placeholder="Please enter title to search" @input="onGroupSearchInput('title')" @keyup.enter="fetchGroups(1)" /></div>
          <div class="field">
            <label class="field-label">Status</label>
            <SelectDropdown v-model="groupFilters.status" class="status-select" :options="groupStatusOptions" aria-label="Status" />
          </div>
          <div class="field field--range"><label class="field-label">Dates</label><DateRangePicker v-model:from="groupFilters.from" v-model:to="groupFilters.to" /></div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="groupsLoading" @click="fetchGroups(1)">{{ groupsLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="groupsLoading" @click="resetGroupFilters">Reset</button>
          </div>
        </div>
      </FilterCard>

      <TableCard class="results">
        <TableCardHeading title="Find results" />
        <p v-if="groupsError" class="error tbl-error" role="alert">{{ groupsError }}</p>
        <p v-if="!groupsLoading && groups.length === 0 && !groupsError" class="empty tbl-empty">No bot groups found.</p>
        <div v-if="groups.length || groupsLoading" class="tbl-scroll">
          <table class="table">
            <thead>
              <tr><th>UID</th><th>Group ID</th><th>Title</th><th>Username</th><th>Type</th><th>Status</th><th>Balance</th><th>Deposits</th><th>Last Active</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="g in groups" :key="g.groupId">
                <td class="mono"><span class="badge uid-badge">{{ uidFor(g.groupId, g.uid) }}</span></td>
                <td class="mono">{{ g.groupId }}</td>
                <td>{{ g.title || '—' }}</td>
                <td class="mono">{{ g.username ? '@' + g.username : '—' }}</td>
                <td><span class="badge">{{ g.type || '—' }}</span></td>
                <td><span :class="['badge', 'status-badge', statusClass(g.status)]">{{ g.status }}</span></td>
                <td class="mono">{{ money(g.balance) }}</td>
                <td class="mono">{{ g.totalDeposits ?? 0 }}</td>
                <td class="muted">{{ fmt(g.lastActiveAt) }}</td>
                <td class="muted">{{ fmt(g.updatedAt || g.statusUpdatedAt) }}</td>
                <td class="cell-actions-end">
                  <div class="row-actions">
                    <button class="btn btn-sm action-btn" type="button" title="Edit group" @click="openGroupStatusPopup(g)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                        <path d="M4 20h4L19.6 8.4a2.1 2.1 0 0 0-3-3L5 17v3z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14.6 6.4l3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                      </svg>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TableFooter :page="groupPage" :total-pages="groupTotalPages" :total="groupTotal" :page-size="groupPageSize" :disabled="groupsLoading" direct-input show-page-sizes @change="fetchGroups" @size-change="setGroupPageSize" />
      </TableCard>
    </div>

    <!-- Group Status Popup -->
    <Transition name="modal-pop">
    <div v-if="groupStatusPopup.open" class="modal-overlay" @click.self="groupStatusPopup.open = false">
      <div class="modal modal--actions" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Edit — {{ groupStatusPopup.group?.groupId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="groupStatusPopup.open = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-field-grid">
            <div class="field">
              <span class="field-label">Current status</span>
              <span :class="['badge', 'status-badge', statusClass(groupStatusPopup.group?.status)]">{{ groupStatusPopup.group?.status }}</span>
            </div>
            <div class="field">
              <span class="field-label">Details</span>
              <button class="btn status-action-btn" type="button" title="Open group details" @click="openGroupDetail(groupStatusPopup.group); groupStatusPopup.open = false">View</button>
            </div>
            <div class="field">
              <span class="field-label">Balance</span>
              <button class="btn status-action-btn status-action-btn--adjust" type="button" title="Credit or debit balance" @click="openAdjust(groupStatusPopup.group); groupStatusPopup.open = false">Adjust balance</button>
            </div>
            <div v-if="groupStatusPopup.group?.status !== 'banned'" class="field">
              <span class="field-label">Block</span>
              <button class="btn status-action-btn status-action-btn--danger" type="button" title="Permanently block group" @click="openStatus(groupStatusPopup.group, 'ban'); groupStatusPopup.open = false">Ban</button>
            </div>
            <div v-if="groupStatusPopup.group?.status !== 'suspended'" class="field">
              <span class="field-label">Pause</span>
              <button class="btn status-action-btn status-action-btn--warning" type="button" title="Temporarily pause group" @click="openStatus(groupStatusPopup.group, 'suspend'); groupStatusPopup.open = false">Suspend</button>
            </div>
            <div v-if="groupStatusPopup.group?.status !== 'active'" class="field">
              <span class="field-label">Restore</span>
              <button class="btn status-action-btn status-action-btn--success" type="button" title="Restore group access" @click="openStatus(groupStatusPopup.group, 'unban'); groupStatusPopup.open = false">Unban / Activate</button>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="groupStatusPopup.open = false">Close</button>
        </div>
      </div>
    </div>
    </Transition>

    <!-- Transactions -->
    <div v-show="activeTab === 'transactions'" class="tab-panel">
      <FilterCard v-model="txnFiltersOpen" title="Transaction filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">Trn ID</label><input v-model="txnFilters.trnId" class="input" placeholder="Please enter transaction ID to search" @input="onTxnSearchInput('trnId')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field"><label class="field-label">Order ID</label><input v-model="txnFilters.orderId" class="input" placeholder="Please enter order ID to search" @input="onTxnSearchInput('orderId')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field"><label class="field-label">Group ID</label><input v-model="txnFilters.groupId" class="input" placeholder="Please enter group ID to search" @input="onTxnSearchInput('groupId')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field"><label class="field-label">UID</label><input v-model="txnFilters.uid" class="input" placeholder="Please enter UID to search" maxlength="5" inputmode="numeric" @input="onTxnSearchInput('uid')" @keyup.enter="fetchTransactions(1)" /></div>
          <div class="field">
            <label class="field-label">Type</label>
            <SelectDropdown v-model="txnFilters.type" class="status-select" :options="txnTypeOptions" aria-label="Type" />
          </div>
          <div class="field">
            <label class="field-label">Note</label>
            <SelectDropdown v-model="txnFilters.note" class="status-select" :options="txnNoteOptions" aria-label="Note" />
          </div>
          <div class="field">
            <label class="field-label">Status</label>
            <SelectDropdown v-model="txnFilters.status" class="status-select" :options="txnStatusOptions" aria-label="Status" />
          </div>
          <div class="field field--range"><label class="field-label">Dates</label><DateRangePicker v-model:from="txnFilters.from" v-model:to="txnFilters.to" /></div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="txnsLoading" @click="fetchTransactions(1)">{{ txnsLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="txnsLoading" @click="resetTxnFilters">Reset</button>
          </div>
        </div>
      </FilterCard>

      <TableCard class="results">
        <TableCardHeading title="Find results" />
        <p v-if="txnsError" class="error tbl-error" role="alert">{{ txnsError }}</p>
        <p v-if="!txnsLoading && transactions.length === 0 && !txnsError" class="empty tbl-empty">No bot transactions found.</p>
        <div v-if="transactions.length || txnsLoading" class="tbl-scroll">
          <table class="table">
            <thead>
              <tr><th>Trn ID</th><th>UID</th><th>Group</th><th>Order</th><th>Amount</th><th>Type</th><th>Note</th><th>Balance After</th><th>Status</th><th>Remark</th><th>Created</th><th>Updated</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in transactions" :key="t.trnId">
                <td class="mono">{{ t.trnId }}</td>
                <td class="mono"><span class="badge uid-badge">{{ uidFor(t.groupId, t.uid) }}</span></td>
                <td class="mono">{{ t.groupId }}</td>
                <td class="mono">{{ t.orderId || '—' }}</td>
                <td class="mono">{{ money(t.amount) }}</td>
                <td><span :class="['badge', 'type-badge', t.type === 'credit' ? 'badge--success' : 'badge--danger']">{{ t.type }}</span></td>
                <td><span class="badge">{{ t.note }}</span></td>
                <td class="mono">{{ money(t.balanceAfter) }}</td>
                <td><span :class="['badge', 'status-badge', statusClass(t.status)]">{{ t.status }}</span></td>
                <td class="muted remark">{{ t.remark || '—' }}</td>
                <td class="muted">{{ fmt(t.createdAt) }}</td>
                <td class="muted">{{ fmt(t.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TableFooter :page="txnPage" :total-pages="txnTotalPages" :total="txnTotal" :page-size="txnPageSize" :disabled="txnsLoading" direct-input show-page-sizes @change="fetchTransactions" @size-change="setTxnPageSize" />
      </TableCard>
    </div>

    <!-- Deposit Records (orders) -->
    <div v-show="activeTab === 'orders'" class="tab-panel">
      <FilterCard v-model="orderFiltersOpen" title="Deposit record filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">Order ID</label><input v-model="orderFilters.orderId" class="input" placeholder="Please enter order ID to search" @input="onOrderSearchInput('orderId')" @keyup.enter="fetchOrders(1)" /></div>
          <div class="field"><label class="field-label">Group ID</label><input v-model="orderFilters.groupId" class="input" placeholder="Please enter group ID to search" @input="onOrderSearchInput('groupId')" @keyup.enter="fetchOrders(1)" /></div>
          <div class="field"><label class="field-label">UID</label><input v-model="orderFilters.uid" class="input" placeholder="Please enter UID to search" maxlength="5" inputmode="numeric" @input="onOrderSearchInput('uid')" @keyup.enter="fetchOrders(1)" /></div>
          <div class="field">
            <label class="field-label">Status</label>
            <SelectDropdown v-model="orderFilters.status" class="status-select" :options="orderStatusOptions" aria-label="Status" />
          </div>
          <div class="field field--range"><label class="field-label">Dates</label><DateRangePicker v-model:from="orderFilters.from" v-model:to="orderFilters.to" /></div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="ordersLoading" @click="fetchOrders(1)">{{ ordersLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="ordersLoading" @click="resetOrderFilters">Reset</button>
          </div>
        </div>
      </FilterCard>

      <TableCard class="results">
        <TableCardHeading title="Find results" />
        <p v-if="ordersError" class="error tbl-error" role="alert">{{ ordersError }}</p>
        <p v-if="!ordersLoading && orders.length === 0 && !ordersError" class="empty tbl-empty">No deposit records found.</p>
        <div v-if="orders.length || ordersLoading" class="tbl-scroll">
          <table class="table table--wide">
            <thead>
              <tr><th>Order ID</th><th>UID</th><th>Group</th><th>Amount</th><th>Received</th><th>Status</th><th>UPI ID</th><th>SimplyPay No</th><th>Trn ID</th><th>Requested By</th><th>Created</th><th>Paid At</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="o in orders" :key="o.orderId">
                <td class="mono">{{ o.orderId }}</td>
                <td class="mono"><span class="badge uid-badge">{{ uidFor(o.groupId) }}</span></td>
                <td class="mono">{{ o.groupId }}</td>
                <td class="mono">{{ money(o.amount) }}</td>
                <td class="mono">{{ money(o.receivedAmount) }}</td>
                <td><span :class="['badge', 'status-badge', statusClass(o.status)]">{{ o.status }}</span></td>
                <td class="mono">{{ o.upiId || '—' }}</td>
                <td class="mono">{{ o.simplypayOrderNo || '—' }}</td>
                <td class="mono">{{ o.trnId || '—' }}</td>
                <td class="mono">{{ o.requestedBy || '—' }}</td>
                <td class="muted">{{ fmt(o.createdAt) }}</td>
                <td class="muted">{{ fmt(o.paidAt) }}</td>
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
        <TableFooter :page="orderPage" :total-pages="orderTotalPages" :total="orderTotal" :page-size="orderPageSize" :disabled="ordersLoading" direct-input show-page-sizes @change="fetchOrders" @size-change="setOrderPageSize" />
      </TableCard>
    </div>

    <!-- Payout -->
    <div v-show="activeTab === 'payout'" class="tab-panel">
      <FilterCard v-model="payoutFiltersOpen" title="Payout filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">User ID</label><input v-model="payoutFilters.userid" class="input" placeholder="Please enter user ID to search" @input="onPayoutSearchInput('userid')" @keyup.enter="fetchPayouts(1)" /></div>
          <div class="field">
            <label class="field-label">Status</label>
            <SelectDropdown v-model="payoutFilters.status" class="status-select" :options="payoutStatusOptions" aria-label="Status" />
          </div>
          <div class="field"><label class="field-label">Payout ID</label><input v-model="payoutFilters.payoutId" class="input" placeholder="Please enter payout ID to search" @input="onPayoutSearchInput('payoutId')" @keyup.enter="fetchPayouts(1)" /></div>
          <div class="filter-actions">
            <button class="btn btn-ghost" type="button" @click="openAdjustFromPayout">Adjust Balance</button>
            <button class="btn btn-primary" type="button" @click="openPayoutCreate">Create Payout</button>
            <button class="btn btn-primary" type="button" :disabled="payoutsLoading" @click="fetchPayouts(1)">{{ payoutsLoading ? 'Loading…' : 'Search' }}</button>
            <button class="btn btn-ghost" type="button" :disabled="payoutsLoading" @click="resetPayoutFilters">Reset</button>
          </div>
        </div>
      </FilterCard>

      <TableCard class="results">
        <TableCardHeading :title="`Payout records (${payoutTotal})`" />
        <p v-if="payoutsError" class="error tbl-error" role="alert">{{ payoutsError }}</p>
        <p v-if="!payoutsLoading && payouts.length === 0 && !payoutsError" class="empty tbl-empty">No payout records found.</p>
        <div v-if="payouts.length || payoutsLoading" class="tbl-scroll">
          <table class="table table--wide">
            <thead>
              <tr><th>Source</th><th>Payout / Trn ID</th><th>User</th><th>Amount</th><th>Bank</th><th>Account</th><th>Holder</th><th>IFSC</th><th>Order No</th><th>Status</th><th>Remark</th><th>Created</th><th>Updated</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in payouts" :key="p.key || p.payoutId">
                <td><span :class="['badge', p.source === 'bot' ? 'badge--warning' : 'badge--primary']">{{ p.source === 'bot' ? 'Bot Debit' : 'SimplyPay' }}</span></td>
                <td class="mono">{{ p.payoutId }}</td>
                <td class="mono">{{ p.source === 'bot' ? (p.userid ? 'UID ' + p.userid : '—') : (p.userid ?? 'Merchant') }}</td>
                <td class="mono">{{ money(p.amount) }}</td>
                <td>{{ p.bankName || p.bank?.bankName || '—' }}</td>
                <td class="mono">{{ p.accountNumber || p.account || p.bank?.accountNumber || '—' }}</td>
                <td>{{ p.holderName || p.name || p.bank?.holderName || '—' }}</td>
                <td class="mono">{{ p.ifsc || p.bank?.ifsc || '—' }}</td>
                <td class="mono">{{ p.orderNo || '—' }}</td>
                <td><span :class="['badge', 'status-badge', statusClass(p.status)]">{{ p.status }}</span></td>
                <td class="muted remark">{{ p.remark || '—' }}</td>
                <td class="muted">{{ fmt(p.createdAt) }}</td>
                <td class="muted">{{ fmt(p.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TableFooter :page="payoutPage" :total-pages="payoutTotalPages" :total="payoutTotal" :page-size="payoutPageSize" :disabled="payoutsLoading" direct-input show-page-sizes @change="fetchPayouts" @size-change="setPayoutPageSize" />
      </TableCard>
    </div>

    <!-- Create Payout modal -->
    <Transition name="modal-pop">
    <div v-if="payoutCreateOpen" class="modal-overlay" @click.self="closePayoutCreate">
      <div class="modal modal--actions" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Create SimplyPay Payout</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="closePayoutCreate">✕</button>
        </div>
        <div class="modal-body modal-body--scroll">
          <p class="muted">Leave User ID blank for a merchant-level payout (wallet not debited).</p>
          <p v-if="payoutForm.error" class="error" role="alert">{{ payoutForm.error }}</p>
          <div class="form-field-grid">
            <div class="field">
              <label class="field-label">Amount (INR) <span class="required">*</span></label>
              <input v-model="payoutForm.amount" class="input" type="number" min="0.01" step="0.01" placeholder="Please enter amount" />
            </div>
            <div class="field">
              <label class="field-label">Payout Password <span class="required">*</span></label>
              <input v-model="payoutForm.password" class="input" type="password" placeholder="Please enter payout password" autocomplete="off" />
            </div>
            <div class="field">
              <label class="field-label">User ID <span class="muted">(optional)</span></label>
              <input v-model="payoutForm.userid" class="input" type="number" min="1" placeholder="Please enter user ID" />
            </div>
            <div class="field">
              <label class="field-label">Payout Type</label>
              <SelectDropdown v-model="payoutForm.payoutType" class="form-select" :options="[{ value: 'IFSC', label: 'Bank (IFSC)' }, { value: 'UPI', label: 'UPI / VPA' }]" aria-label="Payout type" />
            </div>
            <div v-if="payoutForm.payoutType === 'UPI'" class="field">
              <label class="field-label">VPA (UPI ID) <span class="required">*</span></label>
              <input v-model="payoutForm.vpa" class="input" type="text" placeholder="Please enter UPI ID" />
            </div>
            <template v-else>
              <div class="field">
                <label class="field-label">IFSC Code <span v-if="!payoutForm.userid" class="required">*</span></label>
                <input v-model="payoutForm.ifsc" class="input" type="text" placeholder="Please enter IFSC code" />
              </div>
              <div class="field">
                <label class="field-label">Account No. <span v-if="!payoutForm.userid" class="required">*</span></label>
                <input v-model="payoutForm.account" class="input" type="text" placeholder="Please enter account number" />
              </div>
              <div class="field">
                <label class="field-label">Account Holder Name <span v-if="!payoutForm.userid" class="required">*</span></label>
                <input v-model="payoutForm.holderName" class="input" type="text" placeholder="Please enter account holder name" />
              </div>
              <div class="field">
                <label class="field-label">Bank Name <span class="muted">(optional)</span></label>
                <input v-model="payoutForm.bankName" class="input" type="text" placeholder="Please enter bank name" />
              </div>
              <div class="field">
                <label class="field-label">Bank ID <span class="muted">(optional, requires User ID)</span></label>
                <input v-model="payoutForm.bankId" class="input" type="text" placeholder="Please enter bank ID" />
              </div>
            </template>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" :disabled="payoutForm.saving" @click="closePayoutCreate">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="payoutForm.saving" @click="submitPayout">{{ payoutForm.saving ? 'Creating…' : 'Create Payout' }}</button>
        </div>
      </div>
    </div>
    </Transition>

    <!-- Group detail modal -->
    <Transition name="modal-pop">
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
              <div class="stat"><span class="stat-label">Status</span><span class="stat-value stat-value--sm"><span :class="['badge', 'status-badge', statusClass(detail.group.status)]">{{ detail.group.status }}</span></span></div>
              <div class="stat"><span class="stat-label">Total Deposits</span><span class="stat-value">{{ detail.group.totalDeposits ?? 0 }}</span></div>
              <div class="stat"><span class="stat-label">Total Credited</span><span class="stat-value">{{ money(detail.group.totalCredited) }}</span></div>
              <div class="stat"><span class="stat-label">Total Failed</span><span class="stat-value">{{ detail.group.totalFailed ?? 0 }}</span></div>
            </div>

            <div class="detail-grid">
              <div><span class="detail-label">UID</span><span><span class="badge uid-badge">{{ uidFor(detail.group.groupId, detail.group.uid) }}</span></span></div>
              <div><span class="detail-label">Title</span><span>{{ detail.group.title || '—' }}</span></div>
              <div><span class="detail-label">Username</span><span class="mono">{{ detail.group.username ? '@' + detail.group.username : '—' }}</span></div>
              <div><span class="detail-label">Type</span><span>{{ detail.group.type || '—' }}</span></div>
              <div><span class="detail-label">Registered By</span><span class="mono">{{ detail.group.registeredBy || '—' }}</span></div>
              <div><span class="detail-label">Created</span><span>{{ fmt(detail.group.createdAt) }}</span></div>
              <div><span class="detail-label">Last Active</span><span>{{ fmt(detail.group.lastActiveAt) }}</span></div>
              <div><span class="detail-label">Updated</span><span>{{ fmt(detail.group.updatedAt || detail.group.statusUpdatedAt) }}</span></div>
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
                <thead><tr><th>Order ID</th><th>UID</th><th>Amount</th><th>Status</th><th>Created</th><th>Paid At</th></tr></thead>
                <tbody>
                  <tr v-for="o in detail.recentOrders" :key="o.orderId">
                    <td class="mono">{{ o.orderId }}</td>
                    <td class="mono"><span class="badge uid-badge">{{ uidFor(o.groupId || detail.groupId, o.uid) }}</span></td>
                    <td class="mono">{{ money(o.amount) }}</td>
                    <td><span :class="['badge', 'status-badge', statusClass(o.status)]">{{ o.status }}</span></td>
                    <td class="muted">{{ fmt(o.createdAt) }}</td>
                    <td class="muted">{{ fmt(o.paidAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 class="section-heading">Status history</h4>
            <p v-if="detail.history.length === 0" class="empty">No status changes yet.</p>
            <ul v-else class="history-list">
              <li v-for="(h, i) in detail.history" :key="i">
                <span :class="['badge', 'status-badge', statusClass(h.status)]">{{ h.status }}</span>
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
    </Transition>

    <!-- Group status modal -->
    <Transition name="modal-pop">
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
    </Transition>

    <!-- Adjust balance modal -->
    <Transition name="modal-pop">
    <div v-if="adjustDialog.open" class="modal-overlay" @click.self="adjustDialog.open = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Adjust balance</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="adjustDialog.open = false">✕</button>
        </div>
        <div class="modal-body">
          <p v-if="adjustDialog.error" class="error" role="alert">{{ adjustDialog.error }}</p>
          <div class="field">
            <label class="field-label">Group ID <span class="required">*</span></label>
            <input v-model="adjustDialog.groupId" class="input" type="text" placeholder="Please enter group ID" />
          </div>
          <div class="field">
            <label class="field-label">Amount <span class="required">*</span></label>
            <input v-model="adjustDialog.amount" class="input" type="number" min="0.01" step="0.01" placeholder="Please enter amount" />
          </div>
          <div class="field">
            <label class="field-label">Type <span class="required">*</span></label>
            <SelectDropdown v-model="adjustDialog.type" class="form-select" :options="[{ value: 'credit', label: 'credit' }, { value: 'debit', label: 'debit' }]" aria-label="Adjustment type" />
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
    </Transition>

    <!-- Order detail modal -->
    <Transition name="modal-pop">
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
              <div><span class="detail-label">Status</span><span><span :class="['badge', 'status-badge', statusClass(orderDetail.order.status)]">{{ orderDetail.order.status }}</span></span></div>
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
              <div><span class="detail-label">Updated</span><span>{{ fmt(orderDetail.order.updatedAt) }}</span></div>
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
              <div><span class="detail-label">Status</span><span :class="['badge', 'status-badge', statusClass(orderDetail.transaction.status)]">{{ orderDetail.transaction.status }}</span></div>
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
    </Transition>

    <!-- Order action modal -->
    <Transition name="modal-pop">
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
    </Transition>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../composables/useToast.js'
import { fmtDateTime as fmt } from '../utils/format.js'
import {
  getBotGroups, getBotGroup, banBotGroup, suspendBotGroup, unbanBotGroup, adjustBotGroupBalance,
  getBotOrders, getBotOrder, approveBotOrder, rejectBotOrder,
  getBotTransactions, getBotGroupStats,
  createSimplyPayPayout, getSimplyPayPayouts,
} from '../api/client.js'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const BOT_TABS = ['groups', 'transactions', 'orders', 'payout']
const activeTab = ref(BOT_TABS.includes(route.query.tab) ? route.query.tab : 'groups')

// Keep the sidebar flyout submenu and the in-page tabs in sync.
watch(
  () => route.query.tab,
  (tab) => {
    if (BOT_TABS.includes(tab) && tab !== activeTab.value) activeTab.value = tab
  },
)
watch(activeTab, (tab) => {
  if (route.query.tab !== tab) router.replace({ query: { ...route.query, tab } })
})
const groupFiltersOpen = ref(true)
const txnFiltersOpen = ref(true)
const orderFiltersOpen = ref(true)
const payoutFiltersOpen = ref(true)
const BOT_PAGE_SIZE = 10

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

// — Filter dropdown options —
const groupStatusOptions = [
  { value: '', label: 'All' },
  { value: 'active', label: 'active' },
  { value: 'banned', label: 'banned' },
  { value: 'suspended', label: 'suspended' },
]
const txnTypeOptions = [
  { value: '', label: 'All' },
  { value: 'credit', label: 'credit' },
  { value: 'debit', label: 'debit' },
]
const txnNoteOptions = [
  { value: '', label: 'All' },
  { value: 'deposit', label: 'deposit' },
  { value: 'adjustment', label: 'adjustment' },
  { value: 'reversal', label: 'reversal' },
]
const txnStatusOptions = [
  { value: '', label: 'All' },
  { value: 'success', label: 'success' },
  { value: 'reversed', label: 'reversed' },
]
const orderStatusOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'pending' },
  { value: 'success', label: 'success' },
  { value: 'failed', label: 'failed' },
  { value: 'expired', label: 'expired' },
  { value: 'reversed', label: 'reversed' },
]
const payoutStatusOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'pending' },
  { value: 'success', label: 'success' },
  { value: 'failed', label: 'failed' },
]

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
const groupPageSize = ref(BOT_PAGE_SIZE)
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
      limit: groupPageSize.value,
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

function setGroupPageSize(size) {
  groupPageSize.value = size
  fetchGroups(1)
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

function openAdjustFromPayout() {
  Object.assign(adjustDialog, { open: true, groupId: '', amount: '', type: 'credit', remark: '', loading: false, error: '' })
}

async function submitAdjust() {
  const groupId = adjustDialog.groupId.trim()
  if (!groupId) {
    adjustDialog.error = 'Group ID is required'
    return
  }
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
    const res = await adjustBotGroupBalance(groupId, {
      amount,
      type: adjustDialog.type,
      remark: adjustDialog.remark.trim(),
    })
    toast.success(res.msg || `Balance ${adjustDialog.type === 'credit' ? 'credited' : 'debited'} (${res.trnId || 'done'})`)
    adjustDialog.open = false
    fetchGroups(groupPage.value)
    if (detail.open && detail.groupId === groupId) openGroupDetail({ groupId })
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
const txnPageSize = ref(BOT_PAGE_SIZE)
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
      limit: txnPageSize.value,
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

function setTxnPageSize(size) {
  txnPageSize.value = size
  fetchTransactions(1)
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
const orderPageSize = ref(BOT_PAGE_SIZE)
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
      limit: orderPageSize.value,
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

function setOrderPageSize(size) {
  orderPageSize.value = size
  fetchOrders(1)
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

// — SimplyPay Payout —
const payouts = ref([])
const payoutFilters = reactive({ userid: '', status: '', payoutId: '' })
const payoutPage = ref(1)
const payoutPageSize = ref(BOT_PAGE_SIZE)
const payoutTotal = ref(0)
const payoutTotalPages = ref(1)
const payoutsLoading = ref(false)
const payoutsError = ref('')
const payoutsLoaded = ref(false)

const payoutForm = reactive({
  userid: '',
  amount: '',
  password: '123123',
  payoutType: 'IFSC',
  vpa: '',
  bankId: '',
  bankName: '',
  ifsc: '',
  account: '',
  holderName: '',
  saving: false,
  error: '',
})
const payoutCreateOpen = ref(false)

function onPayoutSearchInput(field) {
  if (String(payoutFilters[field]).trim()) {
    for (const key of ['userid', 'payoutId']) {
      if (key !== field) payoutFilters[key] = ''
    }
  }
}

async function fetchPayouts(p = 1) {
  const userid = payoutFilters.userid.trim()
  if (userid && !/^\d+$/.test(userid)) {
    payoutsError.value = 'User ID must be a number'
    toast.error(payoutsError.value)
    return
  }
  payoutsLoading.value = true
  payoutsError.value = ''
  try {
    let spRows = []
    let spTotal = 0
    let spTotalPages = 1
    let spPage = p
    let spError = ''

    try {
      const res = await getSimplyPayPayouts({
        userid,
        status: payoutFilters.status,
        payoutId: payoutFilters.payoutId.trim(),
        page: p,
        limit: payoutPageSize.value,
      })
      const list = res.payouts || res.data || []
      spRows = list.map((row) => ({ ...row, key: `sp-${row.payoutId}`, source: 'simplypay' }))
      spTotal = res.count ?? res.total ?? list.length
      spTotalPages = res.totalPages || 1
      spPage = res.page || p
    } catch (e) {
      spError = e.message
    }

    // Bot debit transactions are shown as payout records too.
    let botRows = []
    let botTotal = 0
    let botTotalPages = 1
    const uidFilter = /^\d{5}$/.test(userid) ? userid : ''
    if (!userid || uidFilter) {
      try {
        const res = await getBotTransactions({
          type: 'debit',
          status: payoutFilters.status,
          uid: uidFilter,
          trnId: payoutFilters.payoutId.trim(),
          page: p,
          limit: payoutPageSize.value,
        })
        const list = res.data || []
        botRows = list.map((t) => ({
          key: `bot-${t.trnId}`,
          source: 'bot',
          payoutId: t.trnId,
          userid: t.uid,
          amount: t.amount,
          orderNo: t.orderId,
          status: t.status,
          remark: t.remark || t.note,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
        botTotal = res.meta?.total || 0
        botTotalPages = res.meta?.totalPages || 1
      } catch {
        // Bot debits are supplementary; the SimplyPay list still renders.
      }
    }

    payouts.value = [...spRows, ...botRows].sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime()
      const bt = new Date(b.createdAt || 0).getTime()
      return bt - at
    })
    payoutPage.value = spPage
    payoutTotal.value = spTotal + botTotal
    payoutTotalPages.value = Math.max(spTotalPages, botTotalPages) || 1
    payoutsLoaded.value = true

    if (spError) {
      payoutsError.value = spError
      toast.error(spError)
    }
  } finally {
    payoutsLoading.value = false
  }
}

function setPayoutPageSize(size) {
  payoutPageSize.value = size
  fetchPayouts(1)
}

function resetPayoutFilters() {
  Object.assign(payoutFilters, { userid: '', status: '', payoutId: '' })
  fetchPayouts(1)
}

function resetPayoutForm() {
  Object.assign(payoutForm, {
    userid: '', amount: '', password: '123123', payoutType: 'IFSC', vpa: '',
    bankId: '', bankName: '', ifsc: '', account: '', holderName: '', saving: false, error: '',
  })
}

function openPayoutCreate() {
  resetPayoutForm()
  payoutCreateOpen.value = true
}

function closePayoutCreate() {
  if (payoutForm.saving) return
  payoutCreateOpen.value = false
  payoutForm.error = ''
}

async function submitPayout() {
  payoutForm.error = ''
  const amount = Number(payoutForm.amount)
  if (!isFinite(amount) || amount <= 0) {
    payoutForm.error = 'Enter a valid amount'
    return
  }
  const password = String(payoutForm.password).trim()
  if (!password) {
    payoutForm.error = 'Payout password is required'
    return
  }
  const userid = String(payoutForm.userid).trim()
  if (userid && (!/^\d+$/.test(userid) || Number(userid) <= 0)) {
    payoutForm.error = 'User ID must be a positive number'
    return
  }

  const payload = { amount, password }
  if (userid) payload.userid = Number(userid)

  if (payoutForm.payoutType === 'UPI') {
    const vpa = payoutForm.vpa.trim()
    if (!vpa) {
      payoutForm.error = 'VPA is required for a UPI payout'
      return
    }
    payload.payoutType = 'UPI'
    payload.vpa = vpa
  } else {
    const ifsc = payoutForm.ifsc.trim()
    const account = payoutForm.account.trim()
    const holderName = payoutForm.holderName.trim()
    const hasAnyBankDetail = !!(ifsc || account || holderName)
    if (!userid) {
      if (!ifsc || !account || !holderName) {
        payoutForm.error = 'IFSC, account and holder name are required when no User ID is provided'
        return
      }
    } else if (hasAnyBankDetail && (!ifsc || !account || !holderName)) {
      payoutForm.error = 'Provide IFSC, account and holder name together'
      return
    }
    if (ifsc) payload.ifsc = ifsc
    if (account) payload.account = account
    if (holderName) payload.holderName = holderName
    if (payoutForm.bankName.trim()) payload.bankName = payoutForm.bankName.trim()
    if (userid && payoutForm.bankId.trim()) payload.bankId = payoutForm.bankId.trim()
  }

  payoutForm.saving = true
  try {
    const data = await createSimplyPayPayout(payload)
    toast.success(data.msg || `Payout ${data.payoutId || ''} created`.trim())
    payoutCreateOpen.value = false
    resetPayoutForm()
    fetchPayouts(1)
  } catch (e) {
    payoutForm.error = e.message
    toast.error(e.message)
  } finally {
    payoutForm.saving = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'payout' && !payoutsLoaded.value) fetchPayouts(1)
})

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
  if (activeTab.value === 'payout') fetchPayouts(1)
})
</script>

<style scoped>
/* ── SimplyPay reference theme (exact palette / fonts / radii) ───────────── */
.page{
  display:flex;flex-direction:column;gap:16px;padding-bottom:16px;min-height:100%;
  --color-primary:#ebaf5b;
  --color-secondary:#f0c078;
  --theme-card-bg:#ffffff;
  --theme-text-primary:#303133;
  --color-bg:#ffffff;
  --color-text:#303133;
  --color-text-secondary:#606266;
  --color-border:#e4e7ed;
  --color-surface-muted:#f5f7fa;
  --color-surface-raised:#fafafa;
  --color-input-bg:#ffffff;
  --color-row-alt:#fafafa;
  --color-success:#67c23a;
  --color-danger:#f56c6c;
  --color-warning:#e6a23c;
  --color-button-primary-bg:#ebaf5b;
  --color-button-primary-hover:#efbf7c;
  --color-button-primary-text:#ffffff;
  --color-button-success-bg:#67c23a;
  --color-button-success-text:#ffffff;
  --color-button-danger-bg:#f56c6c;
  --color-button-danger-text:#ffffff;
  --color-button-warning-bg:#e6a23c;
  --color-button-warning-text:#ffffff;
  --color-control-bg:#ffffff;
  --color-control-hover-bg:#fdf7ef;
  --color-control-border:#dcdfe6;
  --font-body:'PingFang SC','Helvetica Neue',Helvetica,'Microsoft YaHei',Arial,STHeiTi,sans-serif;
  --font-heading:var(--font-body);
  --radius-sm:var(--radius-sm);--radius-md:var(--radius-md);--radius-lg:var(--radius-lg);
  --shadow-card:var(--shadow-card);
  --shadow-subtle:var(--shadow-sm);
  --shadow-dropdown:0 2px 12px 0 rgba(0,0,0,.1);
  --motion-fast:200ms;--motion-normal:250ms;
  --scrollbar-track:transparent;
  --scrollbar-thumb:rgba(144,147,153,.35);
  background:#f0f0f0;
  font-family:var(--font-body);
  font-size:14px;line-height:1.15;color:#606266;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}
.card{background:var(--theme-card-bg,#fff);border:1px solid var(--color-border,#e4e7ed);border-radius:var(--radius-lg);padding:var(--spacing-4);box-shadow:var(--shadow-card);transition:box-shadow var(--motion-normal) ease,transform var(--motion-normal) ease,border-color var(--motion-normal) ease;color:var(--color-text)}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap}
.card-sub{color:#909399;font-size:13px}

.tbl-scroll{min-height:0;min-width:0;overflow:auto;border:1px solid #ebeef5;border-radius:10px;-webkit-overflow-scrolling:touch}
.tbl-scroll::-webkit-scrollbar{height:8px;width:8px}
.tbl-scroll::-webkit-scrollbar-track{background:transparent}
.tbl-scroll::-webkit-scrollbar-thumb{background:rgba(144,147,153,.35);border-radius:8px}
.tbl-scroll::-webkit-scrollbar-thumb:hover{background:rgba(144,147,153,.55)}
@supports not selector(::-webkit-scrollbar){
  .tbl-scroll{scrollbar-width:thin;scrollbar-color:rgba(144,147,153,.35) transparent}
}
.tbl-error{padding:12px 14px;margin:0}
.tbl-empty{padding:20px 14px;margin:0}

.tabs{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;padding:15px;background:var(--theme-card-bg,#fff);border:1px solid #e4e7ed;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 12px rgba(0,0,0,.08);transition:box-shadow .25s ease,transform .25s ease,border-color .25s ease}
.tab{height:32px;line-height:30px;padding:0 15px;margin:0;background:#fff;border:1px solid #dcdfe6;border-radius:8px;color:#606266;font-family:var(--font-body);font-size:14px;font-weight:500;cursor:pointer;box-shadow:none;transition:color .2s ease,background-color .2s ease,border-color .2s ease,transform .2s ease}
.tab:hover:not(.tab--active){color:#ebaf5b;border-color:#ebaf5b;background:#fff;transform:translateY(-1px)}
.tab:active:not(.tab--active){transform:translateY(0)}
.tab--active{color:#fff;background:#ebaf5b;border-color:#ebaf5b}
.tab--active:hover{background:#efbf7c;border-color:#efbf7c;color:#fff;transform:translateY(-1px)}
.tab--active:active{transform:translateY(0)}
.tab-panel{display:flex;flex-direction:column;gap:16px}
.error{color:#f56c6c;font-size:13px;margin-bottom:8px}
.empty{color:#909399;font-size:13px}
.table-wrap{overflow:auto;border:1px solid #ebeef5;border-radius:10px}
.table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0;font-size:13px;color:#606266;background:var(--theme-card-bg,#fff)}
.table--wide{min-width:1150px}
.table--compact{min-width:0}
.table th,.table td{text-align:center;padding:8px 10px;border-bottom:1px solid #ebeef5;border-right:1px solid #ebeef5;vertical-align:middle;background:var(--theme-card-bg,#fff);transition:background-color .25s ease}
.table th:last-child,.table td:last-child{border-right:none}
.table tbody tr:last-child td{border-bottom:none}
.tbl-scroll .table th,.tbl-scroll .table td{white-space:nowrap}
.table tbody tr:nth-child(even) td{background:var(--theme-card-bg,#fff)}
.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}
.break{word-break:break-all}
.muted{color:#909399;font-size:12px}
.remark{max-width:180px;overflow:hidden;text-overflow:ellipsis}
.badge{display:inline-flex;align-items:center;padding:3px 10px;font-size:12px;font-weight:500;line-height:1.5;border-radius:20px;white-space:nowrap;border:1px solid transparent}
.badge--success{background:#f0f9eb;border-color:#e1f3d8;color:#67c23a}
.badge--danger{background:#fef0f0;border-color:#fde2e2;color:#f56c6c}
.badge--warning{background:#fdf6ec;border-color:#faecd8;color:#e6a23c}
.badge--primary{background:#fdf7ef;border-color:#f9e7ce;color:#ebaf5b}
.uid-badge{background:#fdf7ef;border:1px solid #f9e7ce;color:#ebaf5b}
.status-badge,.type-badge{background:#f4f4f5;border:1px solid #e9e9eb;color:#909399}
.status-badge.badge--success,.type-badge.badge--success{background:#f0f9eb;border-color:#e1f3d8;color:#67c23a}
.status-badge.badge--danger,.type-badge.badge--danger{background:#fef0f0;border-color:#fde2e2;color:#f56c6c}
.status-badge.badge--warning{background:#fdf6ec;border-color:#faecd8;color:#e6a23c}
.status-badge.badge--primary{background:#fdf7ef;border-color:#f9e7ce;color:#ebaf5b}
.row-actions{display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:nowrap;white-space:nowrap}
.row-actions>.btn{flex:0 0 auto}
.row-actions .action-btn{padding:var(--spacing-1) var(--spacing-3);font-size:var(--text-body-l);font-weight:500;line-height:1;border-radius:var(--radius-md);background:var(--color-control-bg);border:1px solid var(--color-control-border);color:var(--color-text);box-shadow:var(--shadow-sm);transition:color var(--motion-fast) ease,background-color var(--motion-fast) ease,border-color var(--motion-fast) ease,box-shadow var(--motion-fast) ease}
.row-actions .action-btn:hover:not(:disabled){background:#fdf7ef;border-color:#f9e7ce;color:#ebaf5b;transform:translateY(-1px)}
.row-actions .action-btn:active:not(:disabled){transform:translateY(0)}
.row-actions .action-btn--success{background:#67c23a;border-color:#67c23a;color:#fff}
.row-actions .action-btn--success:hover:not(:disabled){background:#85ce61;border-color:#85ce61;color:#fff}
.row-actions .action-btn--success:active:not(:disabled){background:#5eb870;border-color:#5eb870}
.row-actions .action-btn--danger{background:#f56c6c;border-color:#f56c6c;color:#fff}
.row-actions .action-btn--danger:hover:not(:disabled){background:#f78989;border-color:#f78989;color:#fff}
.row-actions .action-btn--danger:active:not(:disabled){background:#dd6161;border-color:#dd6161}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.stat{display:flex;flex-direction:column;gap:4px;padding:12px 15px;background:#f5f7fa;border:1px solid #e4e7ed;border-radius:8px}
.stat-label{font-size:14px;font-weight:400;color:#909399}
.stat-value{font-size:20px;font-weight:700;color:#303133}
.stat-value--sm{font-size:13px}
.detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px 18px;font-size:14px;color:#303133}
.detail-grid>div{display:flex;flex-direction:column;gap:2px;min-width:0}
.detail-full{grid-column:1 / -1}
.detail-label{font-size:12px;font-weight:400;color:#909399}
.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;font-weight:600;color:#303133;margin-top:6px;padding-bottom:8px;border-bottom:1px solid #e4e7ed}
.window-toggle{display:inline-flex;gap:8px}
.window-toggle .btn{height:32px;min-height:32px;padding:0 15px;font-family:var(--font-body);font-size:12px;font-weight:500;line-height:30px;border-radius:8px;box-shadow:none;transition:color .2s ease,background-color .2s ease,border-color .2s ease,transform .2s ease}
.window-toggle .btn:hover:not(:disabled){transform:translateY(-1px)}
.window-toggle .btn:active:not(:disabled){transform:translateY(0)}
.window-toggle .btn-primary{background:#ebaf5b;border:1px solid #ebaf5b;color:#fff}
.window-toggle .btn-primary:hover:not(:disabled){background:#efbf7c;border-color:#efbf7c;color:#fff}
.window-toggle .btn-primary:active:not(:disabled){background:#d49e52;border-color:#d49e52;color:#fff}
.window-toggle .btn-ghost{background:#fff;border:1px solid #dcdfe6;color:#606266}
.window-toggle .btn-ghost:hover:not(:disabled){background:#fff;border-color:#ebaf5b;color:#ebaf5b}
.window-toggle .btn-ghost:active:not(:disabled){background:#fff;border-color:#d49e52;color:#d49e52}
.history-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;font-size:14px}
.history-list li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 10px;background:#f5f7fa;border-radius:8px}
.history-remark{flex:1;min-width:120px}
.field{display:flex;flex-direction:column;gap:6px}
.field-label{font-size:14px;font-weight:400;color:#606266;margin-bottom:0;line-height:1.15}
.required{color:#f56c6c;margin-left:4px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-xl);width:100%;max-width:80vw;min-width:0;display:flex;flex-direction:column;max-height:90vh}
.modal--wide{max-width:80vw}
.modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 20px 10px;border-bottom:1px solid #e4e7ed}
.modal-head h3{font-size:18px;line-height:24px;font-weight:400;color:#303133;word-break:break-all}
.modal-head .btn-ghost{padding:0;width:24px;height:24px;min-height:24px;border:none;background:transparent;color:#909399;font-size:16px;line-height:1;box-shadow:none;transition:color .2s ease}
.modal-head .btn-ghost:hover{color:#ebaf5b}
.modal-body{padding:30px 20px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;color:#606266;font-size:14px}
.modal-body--scroll{max-height:calc(90vh - 130px)}
.modal-foot{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:20px;padding-top:10px;border-top:1px solid #e4e7ed}
.modal .input{width:100%;height:40px;min-height:40px;line-height:38px;padding:0 15px;font-family:var(--font-body);font-size:14px;color:#606266;background:#fff;border:1px solid #dcdfe6;border-radius:8px;box-shadow:none;transition:border-color .2s ease,box-shadow .2s ease}
.modal textarea.input{height:auto;min-height:auto;line-height:1.5;padding:10px 15px;resize:vertical;font-family:inherit}
.modal .input::placeholder{color:#c0c4cc}
.modal .input:focus,.modal .input:focus-visible{outline:none;border-color:#ebaf5b;box-shadow:0 0 0 2px #f0c078}
.modal-foot .btn{padding:var(--spacing-2) var(--spacing-4);font-family:var(--font-body);font-size:var(--text-body-l);font-weight:500;line-height:1;border-radius:var(--radius-md);box-shadow:var(--shadow-sm);transition:transform var(--motion-fast) ease,box-shadow var(--motion-fast) ease,background-color var(--motion-fast) ease,border-color var(--motion-fast) ease,color var(--motion-fast) ease}
.modal-foot .btn:hover:not(:disabled){transform:translateY(-1px)}
.modal-foot .btn:active:not(:disabled){transform:translateY(0)}
.modal-foot .btn-primary{background:#ebaf5b;border:1px solid #ebaf5b;color:#fff}
.modal-foot .btn-primary:hover:not(:disabled){background:#efbf7c;border-color:#efbf7c;color:#fff}
.modal-foot .btn-primary:active:not(:disabled){background:#d49e52;border-color:#d49e52;color:#fff}
.modal-foot .btn-primary:disabled{background:#f5d7ad;border-color:#f5d7ad;color:#fff;opacity:1}
.modal-foot .btn-ghost{background:#fff;border:1px solid #dcdfe6;color:#606266}
.modal-foot .btn-ghost:hover:not(:disabled){background:#fdf7ef;border-color:#f9e7ce;color:#ebaf5b}
.modal-foot .btn-ghost:active:not(:disabled){background:#fff;border-color:#d49e52;color:#d49e52}
.modal--actions{width:80vw;max-width:80vw;min-width:0}
.form-field-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px 16px;align-items:start}
.form-field-grid .field{gap:6px;min-width:0}
.form-field-grid .field-label{font-size:14px;font-weight:400;text-transform:none;letter-spacing:0;color:#606266}
.form-field-grid .badge{align-self:flex-start}
.modal-pop-enter-active,
.modal-pop-leave-active{transition:opacity .22s ease}
.modal-pop-enter-active .modal,
.modal-pop-leave-active .modal{transition:transform .24s cubic-bezier(.22,.61,.36,1),opacity .24s ease}
.modal-pop-enter-from,
.modal-pop-leave-to{opacity:0}
.modal-pop-enter-from .modal,
.modal-pop-leave-to .modal{opacity:0;transform:translate3d(0,-14px,0) scale(.97)}
.cell-actions-end{text-align:center}
.cell-actions-end .row-actions{justify-content:center}
.status-action-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:40px;padding:9px 15px;font-family:var(--font-body);font-size:12px;font-weight:500;line-height:1;text-align:center;background:#fff;border:1px solid #dcdfe6;border-radius:8px;color:#606266;box-shadow:none;transition:color .2s ease,background-color .2s ease,border-color .2s ease,transform .2s ease}
.status-action-btn:hover:not(:disabled){background:#fff;border-color:#ebaf5b;color:#ebaf5b;transform:translateY(-1px)}
.status-action-btn:active:not(:disabled){transform:translateY(0)}
.status-action-btn--danger{background:#fef0f0;border-color:#fbc4c4;color:#f56c6c}
.status-action-btn--danger:hover:not(:disabled){background:#f56c6c;border-color:#f56c6c;color:#fff}
.status-action-btn--danger:active:not(:disabled){background:#dd6161;border-color:#dd6161;color:#fff}
.status-action-btn--warning{background:#fdf6ec;border-color:#f5dab1;color:#e6a23c}
.status-action-btn--warning:hover:not(:disabled){background:#e6a23c;border-color:#e6a23c;color:#fff}
.status-action-btn--warning:active:not(:disabled){background:#cf9236;border-color:#cf9236;color:#fff}
.status-action-btn--success{background:#f0f9eb;border-color:#c2e7b0;color:#67c23a}
.status-action-btn--success:hover:not(:disabled){background:#67c23a;border-color:#67c23a;color:#fff}
.status-action-btn--success:active:not(:disabled){background:#5daf34;border-color:#5daf34;color:#fff}
.status-action-btn--adjust{background:#fdf7ef;border-color:#f7dfbd;color:#ebaf5b}
.status-action-btn--adjust:hover:not(:disabled){background:#ebaf5b;border-color:#ebaf5b;color:#fff}
.status-action-btn--adjust:active:not(:disabled){background:#d49e52;border-color:#d49e52;color:#fff}
@media(max-width:640px){
}
</style>
