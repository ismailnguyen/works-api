import { allowCors } from '../../requestHelper';
import NotionService from '../../notionService.js';

const handler = async (request, response) => {
    const notionService = new NotionService();

    const works = await notionService.getPage(request.query.id);

    response.status(200).json(works);
}
  
module.exports = allowCors(handler);
