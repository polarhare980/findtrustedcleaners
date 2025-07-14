console.log('📦 Stripe event received:', event.type);

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  console.log('🎯 Session metadata:', session.metadata);

  const cleanerId = session.metadata?.cleanerId;
  console.log('🧼 cleanerId from session:', cleanerId);

  if (cleanerId) {
    try {
      await connectToDatabase();

      const updatedCleaner = await Cleaner.findByIdAndUpdate(
        cleanerId,
        { isPremium: true },
        { new: true }
      );

      if (!updatedCleaner) {
        console.error('❌ Cleaner not found in DB:', cleanerId);
      } else {
        console.log('✅ Cleaner upgraded to premium:', updatedCleaner._id);
      }
    } catch (err) {
      console.error('❌ DB error while upgrading cleaner:', err);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  } else {
    console.error('❌ No cleanerId found in metadata');
    return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });
  }
}
