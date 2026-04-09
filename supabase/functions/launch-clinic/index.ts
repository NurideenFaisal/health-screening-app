import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function buildClinicSlug(name: string, code: string) {
  const source = `${name} ${code}`
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function sanitizeClinicSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser(token)

    if (callerError || !caller) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', caller.id)
      .single()

    if (callerProfileError || !callerProfile) {
      return jsonResponse({ error: 'Unable to verify caller profile' }, 403)
    }

    if (callerProfile.role !== 'super-admin') {
      return jsonResponse({ error: 'Only super-admins can launch clinics' }, 403)
    }

    const payload = await req.json()

    const clinicName = String(payload.clinicName ?? '').trim()
    const clinicCode = String(payload.clinicCode ?? '').trim().toUpperCase()
    const clinicAddress = String(payload.clinicAddress ?? '').trim()
    const phoneContact = String(payload.phoneContact ?? '').trim()
    const requestedSlug = String(payload.slug ?? '').trim()
    const adminEmail = String(payload.adminEmail ?? '').trim().toLowerCase()
    const adminFullName = String(payload.adminFullName ?? `${clinicName} Admin`).trim()
    const customPassword = String(payload.adminPassword ?? '').trim()
    const clinicSlug = sanitizeClinicSlug(requestedSlug || buildClinicSlug(clinicName, clinicCode))

    if (!clinicName || !clinicCode || !adminEmail) {
      return jsonResponse({ error: 'Clinic name, clinic code, and admin email are required' }, 400)
    }

    if (!adminEmail.includes('@')) {
      return jsonResponse({ error: 'Admin email must be valid' }, 400)
    }

    if (!clinicSlug) {
      return jsonResponse({ error: 'Clinic slug must be valid' }, 400)
    }

    if (customPassword && customPassword.length < 6) {
      return jsonResponse({ error: 'Custom password must be at least 6 characters' }, 400)
    }

    const { count: existingClinicCount, error: clinicLookupError } = await supabaseAdmin
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .eq('code', clinicCode)

    if (clinicLookupError) {
      return jsonResponse({ error: clinicLookupError.message }, 500)
    }

    if ((existingClinicCount ?? 0) > 0) {
      return jsonResponse({ error: 'Clinic code already exists' }, 409)
    }

    const { count: existingSlugCount, error: slugLookupError } = await supabaseAdmin
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .eq('slug', clinicSlug)

    if (slugLookupError) {
      return jsonResponse({ error: slugLookupError.message }, 500)
    }

    if ((existingSlugCount ?? 0) > 0) {
      return jsonResponse({ error: 'Clinic slug already exists' }, 409)
    }

    const adminPassword = customPassword || generateSecurePassword()
    const emailDomain = adminEmail.split('@')[1] ?? null

    let createdClinicId: string | null = null
    let createdAuthUserId: string | null = null

    try {
      const { data: clinic, error: clinicInsertError } = await supabaseAdmin
        .from('clinics')
        .insert({
          name: clinicName,
          code: clinicCode,
          address: clinicAddress || null,
          is_active: true,
          slug: clinicSlug,
          email_domain: emailDomain,
          phone_contact: phoneContact || null,
        })
        .select('id, name, code, slug, email_domain, phone_contact, is_active')
        .single()

      if (clinicInsertError || !clinic) {
        throw new Error(clinicInsertError?.message || 'Failed to create clinic')
      }

      createdClinicId = clinic.id

      const { data: createdUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminFullName,
          role: 'admin',
          section: null,
        },
      })

      if (createUserError || !createdUserData.user) {
        throw new Error(createUserError?.message || 'Failed to create admin user')
      }

      createdAuthUserId = createdUserData.user.id

      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: createdUserData.user.id,
          full_name: adminFullName,
          role: 'admin',
          section: null,
          clinic_id: clinic.id,
        })

      if (profileUpsertError) {
        throw new Error(profileUpsertError.message)
      }

      return jsonResponse({
        success: true,
        clinic,
        admin: {
          id: createdUserData.user.id,
          email: adminEmail,
          full_name: adminFullName,
          role: 'admin',
          clinic_id: clinic.id,
        },
        credentials: {
          email: adminEmail,
          password: adminPassword,
          generated: !customPassword,
        },
      })
    } catch (innerError) {
      if (createdAuthUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
      }

      if (createdClinicId) {
        await supabaseAdmin
          .from('clinics')
          .delete()
          .eq('id', createdClinicId)
      }

      throw innerError
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
