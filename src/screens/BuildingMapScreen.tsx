// src/screens/BuildingMapScreen.tsx
// ============================================================
// Interactive campus building map with live occupancy.
//
// IMPLEMENTATION: Uses React Native Views to render the floor
// plan — no extra native packages needed.
// Rooms are colour-coded green/red/grey by live status.
// Tapping any room navigates to its detail screen.
//
// Rooms and floors are generated from the `spaces` table, so
// adding/removing a space in Supabase updates the map automatically.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSpaces } from '../hooks/useSpaces';
import { Colors, FontSize, Radius, Spacing } from '../lib/theme';

// ── Layout: rooms are placed in a simple grid ────────────────
// Sizes depend on the current window so the map adapts to rotation.
const GAP = 8;
const CELL_H = 64;

function statusColor(status: string | null) {
  if (status === 'free')     return Colors.free;
  if (status === 'occupied') return Colors.occupied;
  return Colors.unknown;
}
function statusBg(status: string | null) {
  if (status === 'free')     return 'rgba(16,185,129,0.18)';
  if (status === 'occupied') return 'rgba(239,68,68,0.18)';
  return 'rgba(75,85,99,0.18)';
}

interface Props { navigation: any }

export function BuildingMapScreen({ navigation }: Props) {
  const { spaces } = useSpaces();
  const { width: screenW } = useWindowDimensions();
  const MAP_W = screenW - Spacing.lg * 2;
  const COLS = Math.max(3, Math.floor(MAP_W / 150)); // more columns in landscape
  const CELL_W = (MAP_W - GAP * (COLS + 1)) / COLS;
  const [activeFloor, setActiveFloor] = useState<number>(0);

  // Floors come from the data, sorted ascending
  const floors = Array.from(new Set(spaces.map(s => s.floor))).sort((a, b) => a - b);
  const currentFloor = floors.includes(activeFloor) ? activeFloor : floors[0];
  const floorSpaces = spaces
    .filter(s => s.floor === currentFloor)
    .sort((a, b) => a.building.localeCompare(b.building) || a.name.localeCompare(b.name));
  const rows = Math.max(1, Math.ceil(floorSpaces.length / COLS));
  const mapH = rows * (CELL_H + GAP) + GAP;

  const freeCount     = spaces.filter(s => s.last_status === 'free').length;
  const occupiedCount = spaces.filter(s => s.last_status === 'occupied').length;
  const unknownCount  = spaces.length - freeCount - occupiedCount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Campus Map</Text>
          <Text style={styles.sub}>Live occupancy · tap a room</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Legend */}
        <View style={styles.legend}>
          <LegendDot color={Colors.free}     label={`${freeCount} Free`} />
          <LegendDot color={Colors.occupied} label={`${occupiedCount} Full`} />
          <LegendDot color={Colors.unknown}  label={`${unknownCount} Unknown`} />
        </View>

        {/* Floor selector */}
        <View style={styles.floorTabs}>
          {floors.map(f => (
            <TouchableOpacity key={f} onPress={() => setActiveFloor(f)}
              style={[styles.floorTab, currentFloor === f && styles.floorTabActive]}>
              <Text style={[styles.floorTabText, currentFloor === f && styles.floorTabTextActive]}>
                Floor {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floor plan */}
        {floorSpaces.length === 0 ? (
          <Text style={styles.emptyText}>No spaces available yet.</Text>
        ) : (
          <View style={[styles.mapCanvas, { width: MAP_W, height: mapH }]}>
            {floorSpaces.map((space, i) => {
              const status = space.last_status ?? null;
              return (
                <TouchableOpacity
                  key={space.id}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}
                  style={[styles.room, {
                    left:   GAP + (i % COLS) * (CELL_W + GAP),
                    top:    GAP + Math.floor(i / COLS) * (CELL_H + GAP),
                    width:  CELL_W,
                    height: CELL_H,
                    backgroundColor: statusBg(status),
                    borderColor: statusColor(status),
                  }]}>
                  <View style={[styles.roomDot, { backgroundColor: statusColor(status) }]} />
                  <Text style={styles.roomLabel} numberOfLines={2}>{space.name}</Text>
                  <Text style={styles.roomCap} numberOfLines={1}>{space.capacity}🪑</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Space list for this floor */}
        {floorSpaces.length > 0 && (
          <Text style={styles.listTitle}>Spaces on Floor {currentFloor}</Text>
        )}

        {floorSpaces.map(space => (
          <TouchableOpacity
            key={space.id}
            style={styles.rowItem}
            onPress={() => navigation.navigate('SpaceDetail', { spaceId: space.id })}>
            <View style={[styles.rowDot, { backgroundColor: statusColor(space.last_status ?? null) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{space.name}</Text>
              <Text style={styles.rowMeta}>{space.building} · {space.capacity} seats</Text>
            </View>
            <Text style={[styles.rowStatus, { color: statusColor(space.last_status ?? null) }]}>
              {space.last_status === 'free' ? 'Free'
                : space.last_status === 'occupied' ? 'Full' : 'Unknown'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md },
  title:     { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:       { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  livePill:  { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.free },
  liveText:  { color: Colors.free, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },

  legend:    { flexDirection: 'row', gap: 16, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },

  floorTabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
  floorTab:  { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  floorTabActive:     { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  floorTabText:       { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  floorTabTextActive: { color: Colors.accentLight },

  mapCanvas: { marginHorizontal: Spacing.lg, backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    position: 'relative', overflow: 'hidden', marginBottom: Spacing.lg },


  room: { position: 'absolute', borderRadius: Radius.sm, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', padding: 2 },
  roomDot:   { position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4 },
  roomLabel: { color: Colors.textPrimary, fontSize: 8, fontWeight: '700', textAlign: 'center' },
  roomCap:   { color: Colors.textMuted, fontSize: 7, textAlign: 'center' },

  emptyText: { color: Colors.textMuted, textAlign: 'center', padding: Spacing.lg },
  listTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  rowItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowName:   { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  rowMeta:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  rowStatus: { fontSize: FontSize.sm, fontWeight: '700' },

});
