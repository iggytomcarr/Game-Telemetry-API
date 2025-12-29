import axios from 'axios';
import { logger } from '../utils/logger';

export class AlertService {
  private webhookUrl: string | undefined;
  private lastAlertTime: Map<string, number> = new Map();
  private alertCooldown = 5 * 60 * 1000; // 5 minutes between alerts per game

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  async sendCrashAlert(
    gameId: string, 
    crashCount: number, 
    threshold: number
  ): Promise<void> {
    if (!this.webhookUrl) {
      logger.debug('Discord webhook not configured, skipping alert');
      return;
    }

    // Check cooldown to avoid spam
    const lastAlert = this.lastAlertTime.get(gameId) || 0;
    if (Date.now() - lastAlert < this.alertCooldown) {
      logger.debug(`Alert cooldown active for ${gameId}, skipping`);
      return;
    }

    const embed = {
      title: `🚨 Crash Alert: ${gameId}`,
      color: 0xff0000, // Red
      description: 'Crash rate has exceeded threshold!',
      fields: [
        {
          name: 'Crashes in last hour',
          value: crashCount.toString(),
          inline: true
        },
        {
          name: 'Threshold',
          value: threshold.toString(),
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Game Telemetry API'
      }
    };

    try {
      await axios.post(this.webhookUrl, {
        embeds: [embed]
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      this.lastAlertTime.set(gameId, Date.now());
      logger.info(`Crash alert sent for ${gameId}`);
    } catch (error) {
      logger.error('Failed to send Discord alert:', error);
    }
  }

  async sendCustomAlert(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<void> {
    if (!this.webhookUrl) return;

    const colors = {
      info: 0x3498db,    // Blue
      warning: 0xf39c12, // Orange
      critical: 0xff0000 // Red
    };

    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };

    try {
      await axios.post(this.webhookUrl, {
        embeds: [{
          title: `${icons[severity]} ${title}`,
          description: message,
          color: colors[severity],
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      logger.error('Failed to send custom alert:', error);
    }
  }
}
