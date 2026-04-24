'use client';

import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, CardActionArea, Typography, Grid,
} from '@mui/material';
import {
  LocalHospital, Restaurant, HomeWork, DirectionsCar, Hotel,
  AccountBalance, Business,
} from '@mui/icons-material';
import { getAllIndustries } from '@/lib/industry-config';

const INDUSTRY_ICONS: Record<string, any> = {
  dentistry: LocalHospital,
  restaurants: Restaurant,
  health_clinics: LocalHospital,
  real_estate: HomeWork,
  car_dealerships: DirectionsCar,
  hospitality: Hotel,
  debt_collection: AccountBalance,
};

const INDUSTRY_COLORS: Record<string, string> = {
  dentistry: '#2196f3',
  restaurants: '#ff9800',
  health_clinics: '#4caf50',
  real_estate: '#9c27b0',
  car_dealerships: '#f44336',
  hospitality: '#00bcd4',
  debt_collection: '#607d8b',
};

export default function VoiceAgentsPage() {
  const router = useRouter();
  const industries = getAllIndustries();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Voice Agents</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered outbound calling agents tailored for each industry. Select an industry to configure and make calls.
      </Typography>

      <Grid container spacing={3}>
        {industries.map((industry) => {
          const IconComponent = INDUSTRY_ICONS[industry.id] || Business;
          const color = INDUSTRY_COLORS[industry.id] || '#1976d2';

          return (
            <Grid item xs={12} sm={6} md={4} key={industry.id}>
              <Card>
                <CardActionArea onClick={() => router.push(`/voice-agents/${industry.id}`)}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <IconComponent sx={{ fontSize: 48, color, mb: 2 }} />
                    <Typography variant="h6">{industry.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {industry.conversationGoals.length} conversation goals
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {industry.escalationTriggers.length} escalation triggers
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
