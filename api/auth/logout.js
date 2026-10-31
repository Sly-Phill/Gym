import { endSession } from '../_lib/auth.js'
import { handler } from '../_lib/handler.js'

export default handler({ methods: ['POST'] }, async (req, res) => {
  endSession(res)
  res.status(200).json({ ok: true })
})
