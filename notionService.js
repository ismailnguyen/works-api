export default class NotionService {
    constructor() {
        const { Client } = require("@notionhq/client");

        this.notionClient = new Client({
            baseUrl: process.env.NOTION_API_URL,
            auth: process.env.NOTION_TOKEN
        });
    }

    async getAllPages() {
        const { results } = await this.notionClient.databases.query({
            database_id: process.env.NOTION_PROJECTS_DATABASE_ID,
            filter: {
                property: 'Status',
                select: {
                    equals: 'Published'
                } 
            }
        });

        return results.map(this.parsePageToWork);
    }

    async getPage(pageId) {
        const page = await this.notionClient.pages.retrieve({
            page_id: pageId
        });

        return this.parsePageToWork(page);
    }

    async getPageImages(pageId) {
        const { results } = await this.notionClient.blocks.children.list({
            block_id: pageId
        });

        if (results && results.length > 0) {
            const child = results[0];
            if (child.type === 'child_database'
                    && child.child_database
                    && child.child_database.title === 'Images') {
                return await this.getImages(child.id);
            }
        }

        return null;
    }

    async getImages(databaseId) {
        const { results } = await this.notionClient.databases.query({
            database_id: databaseId
        });

        return results.map(this.parseImages)
    }

    parseImages = ({ properties }) => {
        return {
            url: this.getUrl(properties.Url),
            alt:  this.getTitle(properties.Alt)
        };
    }

    parsePageToWork = ({ id, properties }) => {
        return {
            id: id,
            isPinned: properties.Pinned ? properties.Pinned.checkbox : false,
            coverImage: properties.CoverImageUrl
            ? {
                url: this.getUrl(properties.CoverImageUrl),
                alt:  this.getRichText(properties.CoverImageAlt)
            }
            : undefined,
            logo: properties.LogoUrl
            ? {
                url: this.getUrl(properties.LogoUrl),
                alt: this.getRichText(properties.LogoAlt)
            }
            : undefined,
            title: this.getTitle(properties.Title),
            subTitle: this.getRichText(properties.Subtitle),
            description: this.getRichText(properties.Description),
            primaryLink: properties.PrimaryLinkUrl && properties.PrimaryLinkText
            ? {
                url: this.getUrl(properties.PrimaryLinkUrl),
                text: this.getRichText(properties.PrimaryLinkText)
            }
            : undefined,
            secondaryLink: properties.SecondaryLinkUrl && properties.SecondaryLinkText
            ? {
                url: this.getUrl(properties.SecondaryLinkUrl),
                text: this.getRichText(properties.SecondaryLinkText)
            }
            : undefined,
            markdownContentUrl: properties.MarkdownContentUrl
            ? this.getUrl(properties.MarkdownContentUrl)
            : undefined,
            markdownPrivacyUrl: properties.MarkdownPrivacyUrl
            ? this.getUrl(properties.MarkdownPrivacyUrl)
            : undefined,
            markdownLicenseUrl: properties.MarkdownLicenseUrl
            ? this.getUrl(properties.MarkdownLicenseUrl)
            : undefined,
            embeddedContent: properties.EmbeddedContentUrl
            ? {
                url: this.getUrl(properties.EmbeddedContentUrl),
                orientation: this.getSelectValue(properties.EmbeddedContentOrientation)
            }
            : undefined,
            embeddedVideoUrl: properties.EmbeddedVideoUrl
            ? this.getUrl(properties.EmbeddedVideoUrl)
            : undefined,
            socialShare: properties.SocialShare ? properties.SocialShare.multi_select.map(item => item.name.toLowerCase()) : [],
            tags: properties.Tags ? properties.Tags.multi_select.map(item => item.name) : [],
        };
    }

    getTitle = (property) => {
        if (property
            && property.title
            && property.title[0]
            && property.title[0].text) {
                return property.title[0].text.content;
        }

        return '';
    };

    getRichText = (property) => {
        if (property
            && property.rich_text
            && property.rich_text[0]
            && property.rich_text[0].text) {
                return property.rich_text[0].text.content;
        }

        return '';
    };

    getUrl = (property) => {
        if (property)
            return property.url;
        return '';
    };

    getSelectValue = (property) => {
        if (property && property.select) {
            return property.select.name;
        }

        return '';
    };
}
