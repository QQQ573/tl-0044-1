import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: parseInt(this.configService.get('SMTP_PORT', '1025'), 10),
      secure: false,
      ignoreTLS: true,
    });
    this.from = this.configService.get('SMTP_FROM', 'wms@example.com');
  }

  async sendMail(to: string | string[], subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
    }
  }

  async sendTimeoutAlert(transfer: any): Promise<void> {
    const subject = `【物流超时告警】调拨单 ${transfer.transferNo}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #dc2626;">物流超时告警</h2>
        <p>调拨申请 <strong>${transfer.transferNo}</strong> 物流轨迹已超时未更新，请及时跟进处理。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; width: 30%;">调拨单号</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${transfer.transferNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">调出仓库</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${transfer.sourceWarehouse?.name || transfer.sourceWarehouseId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">调入仓库</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${transfer.targetWarehouse?.name || transfer.targetWarehouseId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">运单号</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${transfer.trackingNo || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">发货时间</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${transfer.shippedAt ? new Date(transfer.shippedAt).toLocaleString('zh-CN') : '-'}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    const recipients = [];
    if (transfer.applicant?.email) recipients.push(transfer.applicant.email);
    if (transfer.approver?.email) recipients.push(transfer.approver.email);

    if (recipients.length === 0) {
      this.logger.warn(`No recipients found for transfer ${transfer.transferNo}, sending to default`);
      recipients.push(this.from);
    }

    await this.sendMail(recipients, subject, html);
  }

  async sendTransferStatusUpdate(transfer: any, oldStatus: string, newStatus: string): Promise<void> {
    const subject = `【状态更新】调拨单 ${transfer.transferNo} 已变更`;
    const statusMap: Record<string, string> = {
      draft: '草稿',
      pending_approval: '待审核',
      pending_shipment: '待出库',
      in_transit: '在途',
      completed: '已入库',
      rejected: '已驳回',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">调拨单状态更新</h2>
        <p>调拨申请 <strong>${transfer.transferNo}</strong> 状态已更新。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; width: 30%;">调拨单号</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${transfer.transferNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">原状态</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${statusMap[oldStatus] || oldStatus}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">新状态</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; color: #2563eb;">${statusMap[newStatus] || newStatus}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    const recipients = [];
    if (transfer.applicant?.email) recipients.push(transfer.applicant.email);

    if (recipients.length > 0) {
      await this.sendMail(recipients, subject, html);
    }
  }
}
