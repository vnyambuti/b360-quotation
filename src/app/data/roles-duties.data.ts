import { Channel, RoleDefinition } from '../models/quotation.models';


export const ROLE_LIBRARY: RoleDefinition[] = [
  {
    id: 'social-media-marketing',
    name: 'Social Media Marketing',
    description: 'Day-to-day management and growth of social channels.',
    duties: [
      {
        id: 'sm-content-calendar',
        name: 'Content calendar planning',
        defaultPrice: 150,
        channelIds: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok'],
      },
      {
        id: 'sm-post-creation',
        name: 'Post creation & scheduling',
        defaultPrice: 100,
        channelIds: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok'],
      },
      {
        id: 'sm-community-mgmt',
        name: 'Community management & engagement',
        defaultPrice: 120,
        channelIds: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'whatsapp'],
      },
      {
        id: 'sm-analytics',
        name: 'Performance analytics & reporting',
        defaultPrice: 90,
        channelIds: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok'],
      },
      {
        id: 'sm-ads',
        name: 'Paid social ad management',
        defaultPrice: 200,
        channelIds: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'paid-ads'],
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Broader marketing strategy, campaigns and brand positioning.',
    duties: [
      {
        id: 'mk-strategy',
        name: 'Marketing strategy development',
        defaultPrice: 400,
        channelIds: ['ooh', 'print', 'website', 'email', 'paid-ads'],
      },
      {
        id: 'mk-campaign',
        name: 'Campaign execution & management',
        defaultPrice: 300,
        channelIds: ['ooh', 'print', 'website', 'email', 'paid-ads'],
      },
      {
        id: 'mk-research',
        name: 'Market research & competitor analysis',
        defaultPrice: 250,
        channelIds: ['website', 'email', 'paid-ads'],
      },
      {
        id: 'mk-branding',
        name: 'Branding & positioning',
        defaultPrice: 350,
        channelIds: ['website', 'ooh', 'print', 'email'],
      },
    ],
  },
  {
    id: 'seo',
    name: 'SEO',
    description: 'Search engine visibility and organic growth.',
    duties: [
      {
        id: 'seo-audit',
        name: 'Technical SEO audit',
        defaultPrice: 300,
        channelIds: ['website'],
      },
      {
        id: 'seo-keyword',
        name: 'Keyword research & mapping',
        defaultPrice: 180,
        channelIds: ['website'],
      },
      {
        id: 'seo-content',
        name: 'On-page content optimization',
        defaultPrice: 150,
        channelIds: ['website'],
      },
      {
        id: 'seo-reporting',
        name: 'Ranking & traffic reporting',
        defaultPrice: 100,
        channelIds: ['website'],
      },
    ],
  },
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    description: 'Visual assets supporting marketing and brand output.',
    duties: [
      {
        id: 'gd-social-assets',
        name: 'Social media graphics',
        defaultPrice: 80,
        channelIds: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok'],
      },
      {
        id: 'gd-brand-assets',
        name: 'Brand collateral design',
        defaultPrice: 220,
        channelIds: ['website', 'print', 'ooh', 'email'],
      },
      {
        id: 'gd-revisions',
        name: 'Revisions & design QA',
        defaultPrice: 60,
        channelIds: ['website', 'instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'print', 'ooh'],
      },
    ],
  },
];
export const CHANNEL_CATALOG: Channel[] = [
  { id: 'ooh', name: 'OOH (Billboards & Banners)', role: 'Marketing' },
  { id: 'print', name: 'Print & Flyers', role: 'Marketing' },
  { id: 'website', name: 'Website', role: 'Digital Marketing' },
  { id: 'email', name: 'Email', role: 'Digital Marketing' },
  { id: 'paid-ads', name: 'Paid Digital Ads', role: 'Digital Marketing' },
  { id: 'instagram', name: 'Instagram', role: 'Social Media Marketing' },
  { id: 'facebook', name: 'Facebook', role: 'Social Media Marketing' },
  { id: 'linkedin', name: 'LinkedIn', role: 'Social Media Marketing' },
  { id: 'youtube', name: 'YouTube', role: 'Social Media Marketing' },
  { id: 'tiktok', name: 'TikTok', role: 'Social Media Marketing' },
  { id: 'whatsapp', name: 'WhatsApp', role: 'Community Outreach' },
  { id: 'vendor-outreach', name: 'Vendor & Partner Outreach', role: 'Community Outreach' },
];
