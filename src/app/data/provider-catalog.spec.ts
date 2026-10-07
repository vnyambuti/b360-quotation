import { buildChannelCatalog, buildRoleLibrary, toInterval } from './provider-catalog';
import { GetProviderData } from '../models/provider.models';

const SAMPLE: GetProviderData = {
  provider: { id: 1, name: 'admin', email: 'test3hunnit@gmail.com', phone: '254724000000' },
  titles: [
    {
      id: 3,
      key: 'Marketing',
      name: 'Marketing',
      description: 'Online and offline channels',
      dutyIds: [],
    },
    {
      id: 5,
      key: 'social-media',
      name: 'Social Media Manager',
      description: 'A social media manager plans, creates, and posts content.',
      dutyIds: ['sm-content-calendar'],
    },
  ],
  duties: [
    {
      id: 9,
      key: 'sm-content-calendar',
      name: 'Content calendar planning',
      defaultPrice: 50000,
      interval: 'Monthly',
      titleId: 5,
      titleName: 'Social Media Manager',
      channelIds: ['instagram', 'facebook'],
    },
  ],
  channels: [
    { id: 15, key: 'instagram', name: 'Instagram', titleIds: ['social-media'] },
    { id: 18, key: 'facebook', name: 'Facebook', titleIds: ['social-media'] },
  ],
};

describe('toInterval', () => {
  it('accepts a known interval regardless of casing or padding', () => {
    expect(toInterval('Weekly')).toBe('Weekly');
    expect(toInterval('  monthly ')).toBe('Monthly');
  });

  it('falls back to Monthly for anything unrecognised', () => {
    expect(toInterval('Quarterly')).toBe('Monthly');
    expect(toInterval(null)).toBe('Monthly');
    expect(toInterval(undefined)).toBe('Monthly');
  });
});

describe('buildRoleLibrary', () => {
  const library = buildRoleLibrary(SAMPLE.titles, SAMPLE.duties);

  it('keys roles by their slug and nests only their own duties', () => {
    expect(library.map((r) => r.id)).toEqual(['Marketing', 'social-media']);
    expect(library[0].duties).toEqual([]);
    expect(library[1].duties).toHaveLength(1);
    expect(library[1].duties[0].id).toBe('sm-content-calendar');
    expect(library[1].duties[0].interval).toBe('Monthly');
    expect(library[1].duties[0].defaultPrice).toBe(50000);
    expect(library[1].duties[0].channelIds).toEqual(['instagram', 'facebook']);
  });

  it('falls back to the title dutyIds when a duty has no titleId', () => {
    const orphan = { ...SAMPLE.duties[0], titleId: 0 };
    const built = buildRoleLibrary(SAMPLE.titles, [orphan]);
    expect(built[0].duties).toHaveLength(0);
    expect(built[1].duties).toHaveLength(1);
  });
});

describe('buildChannelCatalog', () => {
  it('keys channels by their slug and keeps the title tags for grouping', () => {
    expect(buildChannelCatalog(SAMPLE.channels)).toEqual([
      { id: 'instagram', name: 'Instagram', titleIds: ['social-media'] },
      { id: 'facebook', name: 'Facebook', titleIds: ['social-media'] },
    ]);
  });
});
