import { AppError } from '../../middleware/errorHandler';
import { createAlert, expireAlert, getActiveAlerts, setAlertSocket } from '../../services/alertService';
import { publishMessage } from '../../lib/pubsub';
import * as firebaseAdmin from '../../lib/firebaseAdmin';

jest.mock('../../lib/pubsub', () => ({
  publishMessage: jest.fn().mockResolvedValue('msg-1'),
}));

describe('alertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createAlert sanitizes html and returns created alert', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'alert-1' });
    const collection = jest.fn().mockReturnValue({ add });
    jest.spyOn(firebaseAdmin, 'db').mockReturnValue({ collection } as unknown as ReturnType<typeof firebaseAdmin.db>);
    jest.spyOn(firebaseAdmin, 'messaging').mockReturnValue({ send: jest.fn().mockResolvedValue('ok') } as unknown as ReturnType<typeof firebaseAdmin.messaging>);

    const alert = await createAlert({
      venueId: 'venue-1',
      title: ' <b>Critical</b> ',
      body: ' <script>x</script>Evacuate ',
      type: 'critical',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(alert.id).toBe('alert-1');
    expect(alert.title).toBe('Critical');
    expect(alert.body).toBe('xEvacuate');
    expect(add).toHaveBeenCalled();
    expect(publishMessage).toHaveBeenCalled();
  });

  it('createAlert broadcasts over socket when socket registered', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'alert-2' });
    jest.spyOn(firebaseAdmin, 'db').mockReturnValue({ collection: jest.fn().mockReturnValue({ add }) } as unknown as ReturnType<typeof firebaseAdmin.db>);
    jest.spyOn(firebaseAdmin, 'messaging').mockReturnValue({ send: jest.fn().mockResolvedValue('ok') } as unknown as ReturnType<typeof firebaseAdmin.messaging>);

    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    setAlertSocket({ to } as any);

    await createAlert({
      venueId: 'venue-2',
      title: 'Info',
      body: 'Heads up',
      type: 'info',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(to).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('alert:new', expect.objectContaining({ venueId: 'venue-2' }));
  });

  it('getActiveAlerts returns only non-expired and parseable alerts', async () => {
    const now = new Date();
    const snapshot = {
      docs: [
        {
          id: 'a1',
          data: () => ({
            venueId: 'venue-1',
            title: 'A',
            body: 'B',
            type: 'info',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(now.getTime() + 60_000).toISOString(),
            expired: false,
          }),
        },
        {
          id: 'a2',
          data: () => ({
            venueId: 'venue-1',
            title: 'old',
            body: 'old',
            type: 'critical',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(now.getTime() - 60_000).toISOString(),
            expired: false,
          }),
        },
        {
          id: 'bad',
          data: () => ({ invalid: true }),
        },
      ],
    };

    const chain = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(snapshot),
    };
    jest.spyOn(firebaseAdmin, 'db').mockReturnValue({ collection: jest.fn().mockReturnValue(chain) } as unknown as ReturnType<typeof firebaseAdmin.db>);

    const alerts = await getActiveAlerts('venue-1');

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.id).toBe('a1');
    expect(chain.where).toHaveBeenCalledTimes(2);
  });

  it('expireAlert throws 404 when alert does not exist', async () => {
    const get = jest.fn().mockResolvedValue({ exists: false });
    const doc = jest.fn().mockReturnValue({ get });
    jest.spyOn(firebaseAdmin, 'db').mockReturnValue({ collection: jest.fn().mockReturnValue({ doc }) } as unknown as ReturnType<typeof firebaseAdmin.db>);

    await expect(expireAlert('missing', 'admin')).rejects.toBeInstanceOf(AppError);
  });

  it('expireAlert updates alert when found', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const ref = {
      get: jest.fn().mockResolvedValue({ exists: true }),
      update,
    };
    const doc = jest.fn().mockReturnValue(ref);
    jest.spyOn(firebaseAdmin, 'db').mockReturnValue({ collection: jest.fn().mockReturnValue({ doc }) } as unknown as ReturnType<typeof firebaseAdmin.db>);

    await expireAlert('a1', 'admin-1');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ expired: true, expiredBy: 'admin-1' }),
    );
  });
});
