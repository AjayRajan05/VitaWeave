import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
// @ts-ignore
import { Plus, Megaphone, MapPin, Users, Calendar, ChevronLeft } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCampaigns } from '../../lib/api';
import { formatCampaignDate } from '../../lib/formatters';
import type { CampaignRecord } from '../_constants/data';

export default function CampaignPlannerScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);

    const loadCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCampaigns();
            setCampaigns(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCampaigns();
        }, [loadCampaigns])
    );

    const displayStatus = (status: string) => {
        if (status === 'Completed') return 'Completed';
        if (status === 'Active') return 'Active';
        if (status === 'Upcoming') return 'Upcoming';
        return 'Planning';
    };

    const statusStyle = (status: string) => {
        if (status === 'Completed') return styles.statusCompleted;
        return styles.statusUpcoming;
    };

    const statusTextStyle = (status: string) => {
        if (status === 'Completed') return styles.statusTextCompleted;
        return styles.statusTextUpcoming;
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Campaigns</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} disabled>
                    <Plus size={20} color="#fff" />
                    <Text style={styles.addText}>New</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#0891b2" style={{ marginTop: 40 }} />
                ) : campaigns.length === 0 ? (
                    <Text style={styles.emptyText}>No campaigns yet. Create one from the doctor dashboard.</Text>
                ) : (
                    campaigns.map((camp) => (
                        <View key={camp.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.titleRow}>
                                    <View style={styles.iconWrap}>
                                        <Megaphone size={18} color="#0891b2" />
                                    </View>
                                    <Text style={styles.campTitle}>{camp.title}</Text>
                                </View>
                            </View>
                            <View style={styles.badgeRow}>
                                <View style={[styles.statusPill, statusStyle(camp.status)]}>
                                    <Text style={[styles.statusText, statusTextStyle(camp.status)]}>
                                        {displayStatus(camp.status)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.detailRow}>
                                <Calendar size={14} color="#64748b" />
                                <Text style={styles.detailText}>{formatCampaignDate(camp.campaignDate)}</Text>
                            </View>
                            {camp.location ? (
                                <View style={styles.detailRow}>
                                    <MapPin size={14} color="#64748b" />
                                    <Text style={styles.detailText}>{camp.location}</Text>
                                </View>
                            ) : null}
                            <View style={styles.detailRow}>
                                <Users size={14} color="#64748b" />
                                <Text style={styles.detailText}>
                                    Target: {camp.targetAudience ?? `${camp.targetCount} participants`}
                                    {camp.targetCount > 0 ? ` (${camp.progress}% reached)` : ''}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: { padding: 4 },
    title: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#0f172a' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#94a3b8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
    addText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#fff' },
    content: { padding: 20 },
    emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 40 },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
    campTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#0f172a', flex: 1 },
    badgeRow: { marginBottom: 12 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    statusUpcoming: { backgroundColor: '#e0f2fe' },
    statusCompleted: { backgroundColor: '#d1fae5' },
    statusText: { fontFamily: 'Inter-Medium', fontSize: 11 },
    statusTextUpcoming: { color: '#0891b2' },
    statusTextCompleted: { color: '#059669' },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    detailText: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#475569' },
});
