import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      parentId,
      professeurId,
      nombreEnfants,
      matiere,
      prixSouhaite,
      niveauxSouhaites,
      creneauxSouhaites,
      message,
    } = body

    // Validation
    if (!parentId || !professeurId || !message) {
      return NextResponse.json(
        { error: 'Champs manquants (parentId, professeurId, message)' },
        { status: 400 }
      )
    }

    if (!nombreEnfants || Number(nombreEnfants) < 1) {
      return NextResponse.json(
        { error: "Nombre d'enfants invalide (minimum 1)" },
        { status: 400 }
      )
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Le message doit contenir au moins 10 caractères' },
        { status: 400 }
      )
    }

    // Vérifier parent
    const { data: parent } = await supabaseAdmin
      .from('profiles')
      .select('id, nom_complet, role')
      .eq('id', parentId)
      .single()

    if (!parent || parent.role !== 'parent') {
      return NextResponse.json(
        { error: 'Parent introuvable' },
        { status: 404 }
      )
    }

    // Vérifier prof
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id, nom_complet, role')
      .eq('id', professeurId)
      .single()

    if (!prof || prof.role !== 'professeur') {
      return NextResponse.json(
        { error: 'Professeur introuvable' },
        { status: 404 }
      )
    }

    // Vérifier doublon
    const { data: existante } = await supabaseAdmin
      .from('demandes')
      .select('id')
      .eq('parent_id', parentId)
      .eq('professeur_id', professeurId)
      .eq('statut', 'en_attente')
      .single()

    if (existante) {
      return NextResponse.json(
        { error: 'Vous avez déjà une demande en attente pour ce professeur' },
        { status: 400 }
      )
    }

    // Créer la demande
    const { data: demande, error: demandeError } = await supabaseAdmin
      .from('demandes')
      .insert({
        parent_id: parentId,
        professeur_id: professeurId,
        nombre_enfants: Number(nombreEnfants),
        matiere: matiere || null,
        prix_souhaite: prixSouhaite ? Number(prixSouhaite) : null,
        niveaux_souhaites: niveauxSouhaites || [],
        creneaux_souhaites: creneauxSouhaites || [],
        message: message.trim(),
        statut: 'en_attente',
      })
      .select()
      .single()

    if (demandeError) {
      console.error('Erreur création demande:', demandeError)
      return NextResponse.json(
        { error: `Erreur : ${demandeError.message}` },
        { status: 500 }
      )
    }

    // Notifier l'admin
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        destinataire_id: admin.id,
        titre: '📩 Nouvelle demande',
        contenu: `${parent.nom_complet} souhaite contacter ${prof.nom_complet}`,
        lien: `/zx-4f8b2e-9d3a-ctrl/demandes`,
        lu: false,
      }))

      await supabaseAdmin.from('notifications').insert(notifications)
    }

    return NextResponse.json({
      success: true,
      demandeId: demande.id,
      message: 'Demande envoyée avec succès',
    })
  } catch (error: any) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}