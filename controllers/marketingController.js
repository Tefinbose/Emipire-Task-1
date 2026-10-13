const mongoose = require("mongoose");
const MarketingCampaign = require("../models/MarketingCampaign");
const MarketingAutomation = require("../models/MarketingAutomation");
const User = require("../models/User");
const Order = require("../models/Order");

// Helper to seed initial Shopify marketing templates if database is empty
async function ensureSeedData() {
  try {
    const campaignCount = await MarketingCampaign.countDocuments();
    if (campaignCount === 0) {
      await MarketingCampaign.insertMany([
        {
          name: "Festive Season Flash Sale",
          channel: "social",
          status: "active",
          targetAudience: "all",
          discountCode: "FESTIVE20",
          budget: 15000,
          spend: 11200,
          revenue: 68400,
          ordersCount: 42,
          clicks: 3120,
          impressions: 48500,
          subject: "Exclusive 20% Off Festive Collection!",
          content: "Shop the trendiest catalog styles with fast shipping and extra savings.",
          ctaText: "Shop the Sale",
          ctaUrl: "/collections/festive",
          utmSource: "instagram",
          utmMedium: "paid_social",
          utmCampaign: "festive_flash_2026",
          startDate: new Date(Date.now() - 14 * 86400000),
          endDate: new Date(Date.now() + 16 * 86400000),
          recipientsCount: 4850,
          lastDispatchedAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          name: "VIP Members Secret Wardrobe",
          channel: "email",
          status: "active",
          targetAudience: "vip",
          discountCode: "VIPEXCLUSIVE",
          budget: 5000,
          spend: 2100,
          revenue: 43500,
          ordersCount: 28,
          clicks: 1420,
          impressions: 2100,
          subject: "You're Invited: Private VIP Early Access",
          content: "Enjoy complimentary shipping and an extra 25% discount reserved for our top tier shoppers.",
          ctaText: "Unlock VIP Access",
          ctaUrl: "/collections/vip-vault",
          utmSource: "klaviyo",
          utmMedium: "email",
          utmCampaign: "vip_members_private",
          startDate: new Date(Date.now() - 7 * 86400000),
          endDate: new Date(Date.now() + 23 * 86400000),
          recipientsCount: 850,
          lastDispatchedAt: new Date(Date.now() - 1 * 86400000),
        },
        {
          name: "Google High-Intent Search Ads",
          channel: "search",
          status: "active",
          targetAudience: "new_customers",
          discountCode: "WELCOME10",
          budget: 20000,
          spend: 14500,
          revenue: 52300,
          ordersCount: 31,
          clicks: 2240,
          impressions: 34100,
          subject: "Discover Premium Apparel & Lifestyle Essentials",
          content: "Buy premium high-grade lifestyle items backed by 30-day easy returns.",
          ctaText: "Shop Trending",
          ctaUrl: "/collections/trending",
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "google_search_brand",
          startDate: new Date(Date.now() - 21 * 86400000),
          endDate: new Date(Date.now() + 9 * 86400000),
          recipientsCount: 15400,
          lastDispatchedAt: new Date(Date.now() - 3 * 86400000),
        },
        {
          name: "SMS Weekend Flash Drop",
          channel: "sms",
          status: "paused",
          targetAudience: "repeat_buyers",
          discountCode: "FLASH15",
          budget: 4000,
          spend: 2800,
          revenue: 19800,
          ordersCount: 16,
          clicks: 890,
          impressions: 1200,
          subject: "⚡ Flash Alert: Extra 15% off today only",
          content: "Weekend special: Grab fresh arrivals before midnight with code FLASH15.",
          ctaText: "Claim 15% Off",
          ctaUrl: "/collections/weekend-special",
          utmSource: "sms",
          utmMedium: "direct_sms",
          utmCampaign: "sms_weekend_flash",
          startDate: new Date(Date.now() - 5 * 86400000),
          endDate: new Date(Date.now() + 2 * 86400000),
          recipientsCount: 1200,
          lastDispatchedAt: new Date(Date.now() - 5 * 86400000),
        },
      ]);
    }

    const automationCount = await MarketingAutomation.countDocuments();
    if (automationCount === 0) {
      await MarketingAutomation.insertMany([
        {
          name: "Abandoned Checkout Recovery",
          key: "abandoned_checkout",
          description: "Recover potential lost sales by sending an automated email incentive to shoppers who leave checkout.",
          channel: "email",
          status: "active",
          trigger: "Cart abandoned for > 1 hour",
          delay: "1 hour",
          discountCode: "RECOVER10",
          runsTriggered: 142,
          openRate: 54.2,
          clickRate: 24.8,
          revenueRecovered: 38200,
        },
        {
          name: "Welcome New Customer Series",
          key: "welcome_series",
          description: "Warmly introduce new registered shoppers to your store story and offer a first-order incentive.",
          channel: "email",
          status: "active",
          trigger: "Account registered or newsletter signup",
          delay: "Immediate",
          discountCode: "WELCOME10",
          runsTriggered: 289,
          openRate: 68.4,
          clickRate: 31.5,
          revenueRecovered: 29500,
        },
        {
          name: "Customer Win-Back Sequence",
          key: "customer_winback",
          description: "Re-engage shoppers who have not purchased in over 60 days with a personalized return offer.",
          channel: "email",
          status: "active",
          trigger: "No purchase in past 60 days",
          delay: "60 days inactive",
          discountCode: "COMEBACK15",
          runsTriggered: 87,
          openRate: 42.1,
          clickRate: 18.2,
          revenueRecovered: 16400,
        },
        {
          name: "Post-Purchase Thank You & Review",
          key: "post_purchase_upsell",
          description: "Delight shoppers after delivery, request a star review, and recommend complementary products.",
          channel: "email",
          status: "active",
          trigger: "Order status marked delivered",
          delay: "2 days after delivery",
          discountCode: "THANKYOU10",
          runsTriggered: 310,
          openRate: 62.0,
          clickRate: 22.4,
          revenueRecovered: 21800,
        },
        {
          name: "VIP Tier Loyalty Milestone",
          key: "vip_loyalty",
          description: "Celebrate customers surpassing ₹5,000 in total lifetime purchases with exclusive status.",
          channel: "email",
          status: "active",
          trigger: "Lifetime spend reaches ₹5,000",
          delay: "Immediate",
          discountCode: "VIPCLUB20",
          runsTriggered: 44,
          openRate: 78.5,
          clickRate: 41.2,
          revenueRecovered: 34100,
        },
      ]);
    }
  } catch (err) {
    console.error("Failed to seed marketing defaults:", err.message);
  }
}

// 1. Get Marketing Summary / Performance Overview
exports.getMarketingSummary = async (req, res) => {
  try {
    await ensureSeedData();

    const campaigns = await MarketingCampaign.find();
    const automations = await MarketingAutomation.find();

    // Aggregations
    const totalCampaignRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
    const totalAutomationRevenue = automations.reduce((acc, a) => acc + (a.revenueRecovered || 0), 0);
    const totalMarketingRevenue = totalCampaignRevenue + totalAutomationRevenue;

    const totalAdSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
    const totalMarketingOrders = campaigns.reduce((acc, c) => acc + (c.ordersCount || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);

    const overallRoas = totalAdSpend > 0 ? Number((totalMarketingRevenue / totalAdSpend).toFixed(2)) : 0;
    const avgOrderValue = totalMarketingOrders > 0 ? Math.round(totalMarketingRevenue / totalMarketingOrders) : 0;
    const overallConversionRate = totalClicks > 0 ? Number(((totalMarketingOrders / totalClicks) * 100).toFixed(2)) : 0;

    // Store total sales comparison
    const storeSalesAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);
    const storeTotalSales = storeSalesAgg.length > 0 ? storeSalesAgg[0].total : 0;
    const storeTotalOrders = storeSalesAgg.length > 0 ? storeSalesAgg[0].count : 0;

    const salesAttributionRate =
      storeTotalSales > 0
        ? Number(Math.min(100, (totalMarketingRevenue / storeTotalSales) * 100).toFixed(1))
        : 42.5;

    // Channel Performance Breakdown
    const channels = ["email", "social", "search", "sms", "influencer"];
    const channelBreakdown = channels.map((ch) => {
      const chCampaigns = campaigns.filter((c) => c.channel === ch);
      const chAutomations = automations.filter((a) => a.channel === ch);

      const chSpend = chCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
      const chRevenue =
        chCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0) +
        chAutomations.reduce((sum, a) => sum + (a.revenueRecovered || 0), 0);
      const chOrders = chCampaigns.reduce((sum, c) => sum + (c.ordersCount || 0), 0);
      const chClicks = chCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);

      const roas = chSpend > 0 ? Number((chRevenue / chSpend).toFixed(2)) : 0;

      return {
        channel: ch,
        campaignsCount: chCampaigns.length,
        revenue: chRevenue,
        spend: chSpend,
        orders: chOrders,
        clicks: chClicks,
        roas,
        share: totalMarketingRevenue > 0 ? Number(((chRevenue / totalMarketingRevenue) * 100).toFixed(1)) : 0,
      };
    });

    // Real Customer Segments Count
    const totalUsers = await User.countDocuments({ role: "user" });

    // Aggregate users with orders to identify VIPs and repeat buyers
    const userOrderStats = await User.aggregate([
      { $match: { role: "user" } },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customer",
          as: "orders",
        },
      },
      {
        $project: {
          orderCount: { $size: "$orders" },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "o",
                    cond: { $ne: ["$$o.status", "cancelled"] },
                  },
                },
                as: "valid",
                in: "$$valid.totalAmount",
              },
            },
          },
        },
      },
    ]);

    const vipCount = userOrderStats.filter((u) => u.totalSpent >= 5000).length;
    const repeatBuyersCount = userOrderStats.filter((u) => u.orderCount >= 2).length;
    const firstTimeBuyersCount = userOrderStats.filter((u) => u.orderCount === 1).length;
    const inactiveOrCartDropCount = Math.max(0, totalUsers - repeatBuyersCount);

    const audienceSegments = {
      all: totalUsers,
      vip: vipCount,
      repeat_buyers: repeatBuyersCount,
      new_customers: firstTimeBuyersCount || Math.ceil(totalUsers * 0.35),
      abandoned_checkout: inactiveOrCartDropCount || Math.ceil(totalUsers * 0.4),
    };

    // 30-Day Timeline Performance Trend
    const timeline = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Deterministic smooth variation around average for chart
      const dayFactor = 0.7 + 0.6 * Math.sin(i * 0.45 + 1.2);
      const daySales = Math.round((totalMarketingRevenue / 30) * dayFactor);
      const dayOrders = Math.max(1, Math.round((totalMarketingOrders / 30) * dayFactor));
      const daySpend = Math.round((totalAdSpend / 30) * (0.8 + 0.4 * Math.cos(i * 0.3)));

      timeline.push({
        date: dateStr,
        sales: daySales,
        orders: dayOrders,
        spend: daySpend,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalMarketingRevenue,
          storeTotalSales,
          salesAttributionRate,
          totalMarketingOrders,
          storeTotalOrders,
          totalAdSpend,
          overallRoas,
          avgOrderValue,
          totalClicks,
          totalImpressions,
          overallConversionRate,
        },
        channelBreakdown,
        audienceSegments,
        timeline,
        activeCampaignsCount: campaigns.filter((c) => c.status === "active").length,
        activeAutomationsCount: automations.filter((a) => a.status === "active").length,
      },
    });
  } catch (error) {
    console.error("Get marketing summary error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch marketing summary",
      error: error.message,
    });
  }
};

// 2. Get Campaigns List (with filters & search)
exports.getCampaigns = async (req, res) => {
  try {
    await ensureSeedData();

    const { search, status, channel } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { discountCode: regex },
        { subject: regex },
        { utmCampaign: regex },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (channel && channel !== "all") {
      filter.channel = channel;
    }

    const rawCampaigns = await MarketingCampaign.find(filter).sort({ createdAt: -1 });

    const campaigns = rawCampaigns.map((c) => {
      const obj = c.toObject();
      const roas = obj.spend > 0 ? Number((obj.revenue / obj.spend).toFixed(2)) : 0;
      const ctr = obj.impressions > 0 ? Number(((obj.clicks / obj.impressions) * 100).toFixed(2)) : 0;
      const conversionRate = obj.clicks > 0 ? Number(((obj.ordersCount / obj.clicks) * 100).toFixed(2)) : 0;

      return {
        ...obj,
        roas,
        ctr,
        conversionRate,
      };
    });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error("Get campaigns error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch marketing campaigns",
      error: error.message,
    });
  }
};

// 3. Get Single Campaign By ID
exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID" });
    }

    const campaign = await MarketingCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Get campaign by ID error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign details",
      error: error.message,
    });
  }
};

// 4. Create New Campaign
exports.createCampaign = async (req, res) => {
  try {
    const {
      name,
      channel = "email",
      status = "active",
      targetAudience = "all",
      discountCode = "",
      budget = 0,
      spend = 0,
      subject = "",
      content = "",
      ctaText = "Shop Now",
      ctaUrl = "/collections/all",
      utmSource = "",
      utmMedium = "",
      utmCampaign = "",
      startDate,
      endDate,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required",
      });
    }

    // Auto-generate standard Shopify UTM parameters if blank
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const autoUtmSource = utmSource?.trim() || (channel === "social" ? "instagram" : channel === "search" ? "google" : channel);
    const autoUtmMedium = utmMedium?.trim() || (channel === "email" ? "email" : channel === "sms" ? "sms" : "cpc");
    const autoUtmCampaign = utmCampaign?.trim() || cleanName;

    const newCampaign = new MarketingCampaign({
      name: name.trim(),
      channel,
      status,
      targetAudience,
      discountCode: discountCode.trim().toUpperCase(),
      budget: Number(budget) || 0,
      spend: Number(spend) || 0,
      subject: subject.trim(),
      content: content.trim(),
      ctaText: ctaText.trim() || "Shop Now",
      ctaUrl: ctaUrl.trim() || "/collections/all",
      utmSource: autoUtmSource,
      utmMedium: autoUtmMedium,
      utmCampaign: autoUtmCampaign,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
    });

    await newCampaign.save();

    res.status(201).json({
      success: true,
      message: "Marketing campaign created successfully",
      campaign: newCampaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    });
  }
};

// 5. Update Campaign
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID" });
    }

    const {
      name,
      channel,
      status,
      targetAudience,
      discountCode,
      budget,
      spend,
      revenue,
      ordersCount,
      clicks,
      impressions,
      subject,
      content,
      ctaText,
      ctaUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      startDate,
      endDate,
    } = req.body;

    const campaign = await MarketingCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    if (name !== undefined) campaign.name = name.trim();
    if (channel !== undefined) campaign.channel = channel;
    if (status !== undefined) campaign.status = status;
    if (targetAudience !== undefined) campaign.targetAudience = targetAudience;
    if (discountCode !== undefined) campaign.discountCode = discountCode.trim().toUpperCase();
    if (budget !== undefined) campaign.budget = Number(budget) || 0;
    if (spend !== undefined) campaign.spend = Number(spend) || 0;
    if (revenue !== undefined) campaign.revenue = Number(revenue) || 0;
    if (ordersCount !== undefined) campaign.ordersCount = Number(ordersCount) || 0;
    if (clicks !== undefined) campaign.clicks = Number(clicks) || 0;
    if (impressions !== undefined) campaign.impressions = Number(impressions) || 0;
    if (subject !== undefined) campaign.subject = subject.trim();
    if (content !== undefined) campaign.content = content.trim();
    if (ctaText !== undefined) campaign.ctaText = ctaText.trim();
    if (ctaUrl !== undefined) campaign.ctaUrl = ctaUrl.trim();
    if (utmSource !== undefined) campaign.utmSource = utmSource.trim();
    if (utmMedium !== undefined) campaign.utmMedium = utmMedium.trim();
    if (utmCampaign !== undefined) campaign.utmCampaign = utmCampaign.trim();
    if (startDate !== undefined) campaign.startDate = startDate ? new Date(startDate) : new Date();
    if (endDate !== undefined) campaign.endDate = endDate ? new Date(endDate) : null;

    await campaign.save();

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("Update campaign error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
      error: error.message,
    });
  }
};

// 6. Toggle Campaign Status (active / paused / completed)
exports.toggleCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID" });
    }

    const campaign = await MarketingCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    campaign.status = status || (campaign.status === "active" ? "paused" : "active");
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Campaign status updated to ${campaign.status}`,
      campaign,
    });
  } catch (error) {
    console.error("Toggle campaign status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to toggle campaign status",
      error: error.message,
    });
  }
};

// 7. Trigger Campaign Blast (Simulate real outreach dispatch)
exports.triggerCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID" });
    }

    const campaign = await MarketingCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Determine target recipient count from real users
    const totalUsers = await User.countDocuments({ role: "user" });
    let recipients = totalUsers;
    if (campaign.targetAudience === "vip") {
      recipients = Math.max(1, Math.ceil(totalUsers * 0.15));
    } else if (campaign.targetAudience === "repeat_buyers") {
      recipients = Math.max(1, Math.ceil(totalUsers * 0.3));
    } else if (campaign.targetAudience === "new_customers") {
      recipients = Math.max(1, Math.ceil(totalUsers * 0.4));
    } else if (campaign.targetAudience === "abandoned_checkout") {
      recipients = Math.max(1, Math.ceil(totalUsers * 0.25));
    }

    // Update dispatch record & simulate engagement
    const newClicks = Math.floor(recipients * (0.15 + Math.random() * 0.1));
    const newImpressions = recipients * (campaign.channel === "social" || campaign.channel === "search" ? 8 : 1);

    campaign.recipientsCount = (campaign.recipientsCount || 0) + recipients;
    campaign.lastDispatchedAt = new Date();
    campaign.status = "active";
    campaign.clicks = (campaign.clicks || 0) + newClicks;
    campaign.impressions = (campaign.impressions || 0) + newImpressions;

    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Campaign dispatched to ${recipients.toLocaleString()} customers successfully via ${campaign.channel.toUpperCase()}`,
      dispatch: {
        campaignId: campaign._id,
        recipients,
        channel: campaign.channel,
        dispatchedAt: campaign.lastDispatchedAt,
        targetAudience: campaign.targetAudience,
      },
      campaign,
    });
  } catch (error) {
    console.error("Trigger campaign error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to dispatch campaign",
      error: error.message,
    });
  }
};

// 8. Delete Campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID" });
    }

    const campaign = await MarketingCampaign.findByIdAndDelete(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Delete campaign error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error.message,
    });
  }
};

// 9. Get Automations (Shopify Flows)
exports.getAutomations = async (req, res) => {
  try {
    await ensureSeedData();

    const automations = await MarketingAutomation.find().sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: automations.length,
      automations,
    });
  } catch (error) {
    console.error("Get automations error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch automations",
      error: error.message,
    });
  }
};

// 10. Toggle Automation Status (active / paused)
exports.toggleAutomationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid automation ID" });
    }

    const automation = await MarketingAutomation.findById(id);
    if (!automation) {
      return res.status(404).json({ success: false, message: "Automation not found" });
    }

    automation.status = status || (automation.status === "active" ? "paused" : "active");
    await automation.save();

    res.status(200).json({
      success: true,
      message: `Automation "${automation.name}" is now ${automation.status}`,
      automation,
    });
  } catch (error) {
    console.error("Toggle automation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to toggle automation",
      error: error.message,
    });
  }
};

// 11. Update Automation Configuration
exports.updateAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid automation ID" });
    }

    const { delay, discountCode, status } = req.body;

    const automation = await MarketingAutomation.findById(id);
    if (!automation) {
      return res.status(404).json({ success: false, message: "Automation not found" });
    }

    if (delay !== undefined) automation.delay = delay;
    if (discountCode !== undefined) automation.discountCode = discountCode.trim().toUpperCase();
    if (status !== undefined) automation.status = status;

    await automation.save();

    res.status(200).json({
      success: true,
      message: "Automation settings updated successfully",
      automation,
    });
  } catch (error) {
    console.error("Update automation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update automation",
      error: error.message,
    });
  }
};
