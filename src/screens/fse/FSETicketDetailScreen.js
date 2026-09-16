import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, FlatList, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { PARTS_CATALOG } from '../../context/TicketContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

const ACCENT = colors.fse;

export default function FSETicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const { user } = useAuth();
  const { getTicket, updateTicket, addPartsRequest, addBudgetRequest } = useTickets();

  // Service state
  const [serviceNote, setServiceNote] = useState('');
  const [pendingReason, setPendingReason] = useState('');
  const [locating, setLocating] = useState(false);

  // Parts Request state
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partsSearch, setPartsSearch] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [partsReason, setPartsReason] = useState('');

  // Budget Request state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    requestingOfficer: user?.name || '',
    clientName: '',
    purpose: '',
    amount: '',
  });

  const ticket = getTicket(ticketId);

  useEffect(() => {
    if (ticket) {
      setBudgetForm(prev => ({
        ...prev,
        clientName: ticket.clientName || '',
        requestingOfficer: user?.name || '',
      }));
    }
  }, [ticket?.id]);

  if (!ticket) return <View style={styles.center}><Text>Ticket not found.</Text></View>;

  const update = (status, note, extra = {}) => {
    updateTicket(ticketId, { status, ...extra },
      { status, note, by: user.name, at: new Date().toISOString() });
  };

  // ─── Service Actions ────────────────────────────────────────
  const handleStartOnsite = () => {
    Alert.alert('Start Onsite', 'Begin onsite service for this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => update('ONSITE', `${user.name} started onsite service`) },
    ]);
  };

  const handleMarkOngoing = () => {
    Alert.alert('Mark as Ongoing', 'Update status to ongoing for client?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => update('ONSITE', `${user.name} marked service as ongoing`) },
    ]);
  };

  const handleServiceDone = async () => {
    if (!serviceNote.trim()) {
      Alert.alert('Required', 'Please add your service findings.');
      return;
    }
    // Get location
    setLocating(true);
    let locationStr = 'Location not available';
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address) {
          locationStr = [
            address.street,
            address.city,
            address.region,
          ].filter(Boolean).join(', ');
        } else {
          locationStr = `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`;
        }
      }
    } catch (e) {
      locationStr = 'Could not get location';
    }
    setLocating(false);

    Alert.alert(
      'Mark as Done',
      `Location: ${locationStr}\n\nMark this ticket as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Done',
          onPress: () => update(
            'CLOSED',
            `Service completed. Findings: ${serviceNote}`,
            {
              closedBy: user.name,
              serviceFindings: serviceNote,
              closedLocation: locationStr,
              closedAt: new Date().toISOString(),
            }
          ),
        },
      ]
    );
  };

  const handleServicePending = () => {
    if (!pendingReason.trim()) {
      Alert.alert('Required', 'Please describe why service is pending.');
      return;
    }
    update('SERVICE_PENDING', `Service pending: ${pendingReason}`, { pendingReason });
    setPendingReason('');
  };

  // ─── Parts Request ───────────────────────────────────────────
  const filteredParts = PARTS_CATALOG.filter(p =>
    p.code.toLowerCase().includes(partsSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(partsSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(partsSearch.toLowerCase())
  );

  const togglePart = (part) => {
    setSelectedParts(prev => {
      const exists = prev.find(p => p.code === part.code);
      if (exists) {
        return prev.filter(p => p.code !== part.code);
      }
      return [...prev, { ...part, qty: 1 }];
    });
  };

  const updateQty = (code, qty) => {
    setSelectedParts(prev => prev.map(p =>
      p.code === code ? { ...p, qty: Math.max(1, parseInt(qty) || 1) } : p
    ));
  };

  const submitPartsRequest = () => {
    if (selectedParts.length === 0) {
      Alert.alert('Required', 'Please select at least one part.');
      return;
    }
    const req = {
      id: `pr_${Date.now()}`,
      parts: selectedParts,
      reason: partsReason.trim(),
      requestedBy: user.name,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    addPartsRequest(ticketId, req);
    setShowPartsModal(false);
    setSelectedParts([]);
    setPartsSearch('');
    setPartsReason('');
    Alert.alert('✅ Parts Request Submitted', 'Your parts request has been submitted for approval.');
  };

  // ─── Budget Request ──────────────────────────────────────────
  const submitBudgetRequest = () => {
    const { requestingOfficer, clientName, purpose, amount } = budgetForm;
    if (!requestingOfficer.trim() || !clientName.trim() || !purpose.trim() || !amount.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (isNaN(parseFloat(amount))) {
      Alert.alert('Invalid', 'Please enter a valid amount.');
      return;
    }
    const req = {
      id: `br_${Date.now()}`,
      requestingOfficer: requestingOfficer.trim(),
      clientName: clientName.trim(),
      purpose: purpose.trim(),
      amount: parseFloat(amount),
      requestedBy: user.name,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    addBudgetRequest(ticketId, req);
    setShowBudgetModal(false);
    setBudgetForm({ requestingOfficer: user?.name || '', clientName: ticket.clientName || '', purpose: '', amount: '' });
    Alert.alert('✅ Budget Request Submitted', 'Your budget request has been submitted for approval.');
  };

  const isAssigned = ticket.status === 'ASSIGNED_FSE';
  const isOnsite = ticket.status === 'ONSITE';
  const isPending = ticket.status === 'SERVICE_PENDING';
  const isClosed = ticket.status === 'CLOSED';
  const canRequest = isOnsite || isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStatusColor(ticket.status) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{getStatusLabel(ticket.status)}</Text>
          </View>
        </View>
        <Text style={styles.headerTicketNo}>{ticket.ticketNo}</Text>
        <Text style={styles.headerClient}>{ticket.clientName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Scheduled Visit Banner */}
        {ticket.scheduledDate && !isClosed && (
          <View style={styles.scheduleBanner}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleBannerTitle}>Scheduled Visit</Text>
              <Text style={styles.scheduleBannerDate}>{ticket.scheduledDate}</Text>
            </View>
          </View>
        )}

        {/* ── Service Actions ── */}
        {!isClosed && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Service Actions</Text>

            {isAssigned && (
              <ActionBtn
                icon="car"
                label="Start Onsite Service"
                color={colors.info}
                onPress={handleStartOnsite}
              />
            )}

            {isOnsite && (
              <ActionBtn
                icon="refresh-circle"
                label="Mark as Ongoing to Client"
                color={colors.primary}
                onPress={handleMarkOngoing}
              />
            )}

            {(isOnsite || isPending) && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="document-text-outline" size={14} color={colors.textMuted} /> Service Notes / Findings
                  </Text>
                  <TextInput
                    placeholder="What did you find and fix?"
                    placeholderTextColor={colors.textLight}
                    value={serviceNote}
                    onChangeText={setServiceNote}
                    multiline
                    style={styles.textarea}
                  />
                </View>
                <ActionBtn
                  icon={locating ? 'hourglass' : 'checkmark-circle'}
                  label={locating ? 'Getting location...' : 'Mark as Service Done'}
                  color={colors.success}
                  disabled={locating}
                  onPress={handleServiceDone}
                />
              </>
            )}

            {isOnsite && (
              <>
                <View style={styles.divider}><Text style={styles.dividerText}>OR</Text></View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="warning-outline" size={14} color={colors.warning} /> Reason for Pending
                  </Text>
                  <TextInput
                    placeholder="Why can't it be completed today?"
                    placeholderTextColor={colors.textLight}
                    value={pendingReason}
                    onChangeText={setPendingReason}
                    multiline
                    style={styles.textarea}
                  />
                </View>
                <ActionBtn
                  icon="hourglass"
                  label="Mark as Service Pending"
                  color={colors.warning}
                  outline
                  onPress={handleServicePending}
                />
              </>
            )}
          </View>
        )}

        {/* ── Request Buttons (only when Onsite or Pending) ── */}
        {canRequest && (
          <View style={styles.requestsRow}>
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => setShowPartsModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.requestBtnIcon, { backgroundColor: colors.warningBg }]}>
                <Ionicons name="construct" size={22} color={colors.warning} />
              </View>
              <Text style={styles.requestBtnLabel}>Request Parts</Text>
              {(ticket.partsRequests?.length > 0) && (
                <View style={styles.requestCount}>
                  <Text style={styles.requestCountText}>{ticket.partsRequests.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => setShowBudgetModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.requestBtnIcon, { backgroundColor: colors.infoBg }]}>
                <Ionicons name="cash" size={22} color={colors.info} />
              </View>
              <Text style={styles.requestBtnLabel}>Budget Request</Text>
              {(ticket.budgetRequests?.length > 0) && (
                <View style={[styles.requestCount, { backgroundColor: colors.info }]}>
                  <Text style={styles.requestCountText}>{ticket.budgetRequests.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Parts Requests List ── */}
        {(ticket.partsRequests?.length > 0) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={17} color={colors.warning} />
              <Text style={styles.cardTitle}>Parts Requests</Text>
            </View>
            {ticket.partsRequests.map((req, i) => (
              <View key={req.id} style={[styles.reqItem, i < ticket.partsRequests.length - 1 && styles.reqItemBorder]}>
                <View style={{ flex: 1 }}>
                  {req.parts.map(p => (
                    <Text key={p.code} style={styles.reqPartRow}>
                      <Text style={styles.reqPartCode}>{p.code}</Text> — {p.name} × {p.qty}
                    </Text>
                  ))}
                  {req.reason ? <Text style={styles.reqReason}>"{req.reason}"</Text> : null}
                  <Text style={styles.reqMeta}>
                    {req.requestedBy} · {new Date(req.requestedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[styles.reqStatusPill, { backgroundColor: colors.warningBg }]}>
                  <Text style={[styles.reqStatusText, { color: colors.warning }]}>{req.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Budget Requests List ── */}
        {(ticket.budgetRequests?.length > 0) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={17} color={colors.info} />
              <Text style={styles.cardTitle}>Budget Requests</Text>
            </View>
            {ticket.budgetRequests.map((req, i) => (
              <View key={req.id} style={[styles.reqItem, i < ticket.budgetRequests.length - 1 && styles.reqItemBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqAmount}>₱ {parseFloat(req.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
                  <Text style={styles.reqPartRow}><Text style={{ color: colors.textMuted }}>Officer: </Text>{req.requestingOfficer}</Text>
                  <Text style={styles.reqPartRow}><Text style={{ color: colors.textMuted }}>Client: </Text>{req.clientName}</Text>
                  <Text style={styles.reqPartRow}><Text style={{ color: colors.textMuted }}>Purpose: </Text>{req.purpose}</Text>
                  <Text style={styles.reqMeta}>
                    {req.requestedBy} · {new Date(req.requestedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[styles.reqStatusPill, { backgroundColor: colors.infoBg }]}>
                  <Text style={[styles.reqStatusText, { color: colors.info }]}>{req.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Client Info ── */}
        <Card icon="person-outline" title="Client" accent={ACCENT}>
          <Row label="Name" value={ticket.clientName} />
          <Row label="Contact" value={ticket.clientContact} />
          <Row label="Address" value={ticket.clientAddress || 'N/A'} last />
        </Card>

        {/* ── Equipment ── */}
        <Card icon="hardware-chip-outline" title="Equipment" accent={ACCENT}>
          <Row label="Model" value={ticket.productModel || 'N/A'} />
          <Row label="Serial" value={ticket.serialNo || 'N/A'} last />
        </Card>

        {/* ── Concern ── */}
        <Card icon="alert-circle-outline" title="Concern" accent={ACCENT}>
          <View style={[styles.typeTag, { backgroundColor: colors.successBg }]}>
            <Text style={[styles.typeTagText, { color: ACCENT }]}>{ticket.concernType}</Text>
          </View>
          <Text style={styles.concernDesc}>{ticket.concern}</Text>
        </Card>

        {/* ── Banners ── */}
        {ticket.pendingReason && (
          <InfoBanner icon="warning" color={colors.warning} bg={colors.warningBg} title="Pending Reason" text={ticket.pendingReason} />
        )}
        {isClosed && ticket.serviceFindings && (
          <InfoBanner icon="checkmark-circle" color={colors.success} bg={colors.successBg} title="Service Findings" text={ticket.serviceFindings} />
        )}
        {isClosed && ticket.closedLocation && (
          <InfoBanner icon="location" color={colors.info} bg={colors.infoBg} title="Closed at Location" text={ticket.closedLocation} />
        )}

        {/* ── Activity Timeline ── */}
        <Card icon="time-outline" title="Activity Timeline" accent={ACCENT}>
          {(ticket.history || []).slice().reverse().map((h, i, arr) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(h.status) }]} />
                {i < arr.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineNote}>{h.note}</Text>
                <Text style={styles.timelineMeta}>
                  {h.by} · {h.at ? new Date(h.at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Parts Request Modal ─── */}
      <Modal visible={showPartsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Request Parts</Text>
              <TouchableOpacity onPress={() => setShowPartsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textLight} />
              <TextInput
                placeholder="Search by code or name..."
                placeholderTextColor={colors.textLight}
                value={partsSearch}
                onChangeText={setPartsSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Parts List */}
            <FlatList
              data={filteredParts}
              keyExtractor={p => p.code}
              style={styles.partsList}
              renderItem={({ item }) => {
                const selected = selectedParts.find(p => p.code === item.code);
                return (
                  <TouchableOpacity
                    style={[styles.partRow, selected && styles.partRowSelected]}
                    onPress={() => togglePart(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.partCheck, selected && { backgroundColor: colors.warning, borderColor: colors.warning }]}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partCode}>{item.code}</Text>
                      <Text style={styles.partName}>{item.name}</Text>
                      <Text style={styles.partCategory}>{item.category} · {item.unit}</Text>
                    </View>
                    {selected && (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity onPress={() => updateQty(item.code, (selected.qty || 1) - 1)} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={16} color={colors.warning} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{selected.qty || 1}</Text>
                        <TouchableOpacity onPress={() => updateQty(item.code, (selected.qty || 1) + 1)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={16} color={colors.warning} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Selected Summary */}
            {selectedParts.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryText}>
                  {selectedParts.length} part{selectedParts.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            )}

            {/* Reason */}
            <TextInput
              placeholder="Reason for parts request (optional)..."
              placeholderTextColor={colors.textLight}
              value={partsReason}
              onChangeText={setPartsReason}
              style={styles.reasonInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPartsModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.warning }]}
                onPress={submitPartsRequest}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Budget Request Modal ─── */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Budget Request</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <BudgetField
                label="Requesting Officer"
                icon="person-outline"
                value={budgetForm.requestingOfficer}
                onChangeText={v => setBudgetForm(p => ({ ...p, requestingOfficer: v }))}
                placeholder="Your name"
              />
              <BudgetField
                label="Client Name"
                icon="business-outline"
                value={budgetForm.clientName}
                onChangeText={v => setBudgetForm(p => ({ ...p, clientName: v }))}
                placeholder="Client / Company name"
              />
              <BudgetField
                label="Purpose"
                icon="clipboard-outline"
                value={budgetForm.purpose}
                onChangeText={v => setBudgetForm(p => ({ ...p, purpose: v }))}
                placeholder="What is this budget for?"
                multiline
              />
              <BudgetField
                label="Amount (₱)"
                icon="cash-outline"
                value={budgetForm.amount}
                onChangeText={v => setBudgetForm(p => ({ ...p, amount: v }))}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <View style={{ height: 12 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBudgetModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.info }]}
                onPress={submitBudgetRequest}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Helper Components ───────────────────────────────────────

function Card({ icon, title, accent, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={17} color={accent} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, color, outline, disabled, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        outline ? { backgroundColor: color + '18', borderWidth: 1.5, borderColor: color } : { backgroundColor: color },
        disabled && { opacity: 0.6 },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      {disabled
        ? <ActivityIndicator size="small" color={outline ? color : '#fff'} />
        : <Ionicons name={icon} size={19} color={outline ? color : '#fff'} />
      }
      <Text style={[styles.actionBtnText, { color: outline ? color : '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoBanner({ icon, color, bg, title, text }) {
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color }]}>{title}</Text>
        <Text style={styles.bannerText}>{text}</Text>
      </View>
    </View>
  );
}

function BudgetField({ label, icon, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={styles.budgetField}>
      <Text style={styles.budgetLabel}>
        <Ionicons name={icon} size={13} color={colors.textMuted} /> {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        style={[styles.budgetInput, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 54, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full,
  },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerTicketNo: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  headerClient: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  scroll: { padding: spacing.lg },

  scheduleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  scheduleBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.primary },
  scheduleBannerDate: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, marginTop: 2 },

  actionsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    ...shadow.sm, gap: spacing.sm,
  },
  actionsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  textarea: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, fontSize: 14, color: colors.text,
    minHeight: 72, textAlignVertical: 'top',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.md, paddingVertical: 14,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  divider: { alignItems: 'center', marginVertical: spacing.xs },
  dividerText: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1 },

  // Request buttons
  requestsRow: {
    gap: spacing.sm, marginBottom: spacing.md,
  },
  requestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, ...shadow.sm,
  },
  requestBtnIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  requestBtnLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  requestCount: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.warning,
    justifyContent: 'center', alignItems: 'center',
  },
  requestCountText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Requests list
  reqItem: { paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  reqItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  reqPartRow: { fontSize: 13, color: colors.text, marginBottom: 2 },
  reqPartCode: { fontWeight: '700', color: colors.text },
  reqReason: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  reqMeta: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  reqAmount: { fontSize: 18, fontWeight: '800', color: colors.info, marginBottom: 6 },
  reqStatusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  reqStatusText: { fontSize: 10, fontWeight: '800' },

  // Cards
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: spacing.md },
  typeTag: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md,
    paddingVertical: 5, borderRadius: radius.full, marginBottom: spacing.md,
  },
  typeTagText: { fontSize: 12, fontWeight: '700' },
  concernDesc: { fontSize: 14, color: colors.text, lineHeight: 21 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerText: { fontSize: 13, color: colors.text, lineHeight: 19 },

  // Timeline
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  timelineLeft: { alignItems: 'center', width: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  timelineBody: { flex: 1, paddingBottom: spacing.lg },
  timelineNote: { fontSize: 13, color: colors.text, lineHeight: 19 },
  timelineMeta: { fontSize: 11, color: colors.textLight, marginTop: 3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xl, paddingBottom: 36, maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
  partsList: { maxHeight: 300 },
  partRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  partRowSelected: { backgroundColor: colors.warningBg + '66' },
  partCheck: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  partCode: { fontSize: 13, fontWeight: '700', color: colors.text },
  partName: { fontSize: 13, color: colors.textMuted },
  partCategory: { fontSize: 11, color: colors.textLight },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.warningBg,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: '700', color: colors.text, minWidth: 20, textAlign: 'center' },
  selectedSummary: {
    backgroundColor: colors.warningBg, borderRadius: radius.md,
    padding: spacing.sm, marginTop: spacing.sm, alignItems: 'center',
  },
  selectedSummaryText: { fontSize: 13, fontWeight: '700', color: colors.warning },
  reasonInput: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, fontSize: 14, color: colors.text,
    marginTop: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: colors.bg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  submitBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: radius.md,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Budget form
  budgetField: { marginBottom: spacing.md },
  budgetLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  budgetInput: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: 15, color: colors.text,
  },
});
