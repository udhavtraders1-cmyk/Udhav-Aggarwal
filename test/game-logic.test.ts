import { Chess } from 'chess.js';
import { calculateEloChange, ChessRoom } from '../server/chessEngine';
import { TIME_CONTROLS } from '../src/types/chess';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- STARTING STRATAGEM CHESS CORE LOGIC TESTS ---\n');

// Test 1: Standard legal moves & turn alternation
{
  const chess = new Chess();
  assert(chess.turn() === 'w', 'White should move first');
  const move1 = chess.move('e4');
  assert(!!move1 && move1.san === 'e4', 'e4 should be a legal opening move');
  assert(chess.turn() === 'b', 'Turn should alternate to Black');
  const move2 = chess.move('e5');
  assert(!!move2 && move2.san === 'e5', 'e5 should be a legal black response');
}

// Test 2: Knight moves and board representation
{
  const chess = new Chess();
  chess.move('Nf3');
  assert(chess.get('f3')?.type === 'n', 'Knight should occupy f3 square');
  const illegalMove = chess.move('e5'); // Black to move, but pawn e5 is black so ok
  assert(!!illegalMove, 'Black can play e5');
  try {
    chess.move('e5'); // White cannot play e5 again because pawn on e5 already exists
    assert(false, 'Should have failed on duplicate move');
  } catch {
    assert(true, 'Illegal move correctly rejected');
  }
}

// Test 3: Castling (Kingside)
{
  const chess = new Chess();
  chess.move('e4');
  chess.move('e5');
  chess.move('Nf3');
  chess.move('Nc6');
  chess.move('Bc4');
  chess.move('Bc5');
  const castle = chess.move('O-O');
  assert(!!castle && castle.san === 'O-O', 'White should successfully castle kingside');
  assert(chess.get('g1')?.type === 'k', 'King should be on g1 after castling');
  assert(chess.get('f1')?.type === 'r', 'Rook should be on f1 after castling');
}

// Test 4: En Passant capture
{
  const chess = new Chess();
  chess.move('e4');
  chess.move('a6');
  chess.move('e5');
  chess.move('d5');
  const enPassant = chess.move('exd6');
  assert(!!enPassant && enPassant.flags.includes('e'), 'En passant capture must be valid');
  assert(!chess.get('d5'), 'Captured black pawn on d5 must be removed from the board');
}

// Test 5: Pawn Promotion
{
  const chess = new Chess('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
  const promo = chess.move({ from: 'e7', to: 'e8', promotion: 'q' });
  assert(!!promo && promo.promotion === 'q', 'Pawn should promote to Queen');
  assert(chess.get('e8')?.type === 'q', 'Piece on e8 must be a Queen');
}

// Test 6: Check & Checkmate (Scholar's Mate)
{
  const chess = new Chess();
  chess.move('e4');
  chess.move('e5');
  chess.move('Qh5');
  chess.move('Nc6');
  chess.move('Bc4');
  chess.move('Nf6');
  chess.move('Qxf7#');
  assert(chess.isCheck(), 'Black king should be in check');
  assert(chess.isCheckmate(), 'Black should be checkmated (Scholar\'s Mate)');
}

// Test 7: Stalemate
{
  // Known stalemate position: Black king on a8, White queen on c7, White king on a6
  const chess = new Chess('k7/2Q5/K7/8/8/8/8/8 b - - 0 1');
  assert(chess.isStalemate(), 'Position should be recognized as stalemate');
  assert(chess.isDraw(), 'Stalemate is a draw');
  assert(!chess.isCheck(), 'King is not in check during stalemate');
}

// Test 8: Elo calculation accuracy
{
  // Equal rating white win
  const resultWhiteWin = calculateEloChange(1500, 1500, 'w', 32);
  assert(resultWhiteWin.whiteDiff === 16, 'Winner gains 16 ELO when evenly matched');
  assert(resultWhiteWin.blackDiff === -16, 'Loser drops 16 ELO when evenly matched');
  assert(resultWhiteWin.whiteAfter === 1516, 'New white rating is 1516');
  assert(resultWhiteWin.blackAfter === 1484, 'New black rating is 1484');

  // Draw between evenly matched players
  const resultDraw = calculateEloChange(1500, 1500, 'draw', 32);
  assert(resultDraw.whiteDiff === 0, 'No ELO change on draw between equal ratings');
  assert(resultDraw.blackDiff === 0, 'No ELO change on draw between equal ratings');

  // Underdog win (White 1200 beats Black 1600)
  const underdogWin = calculateEloChange(1200, 1600, 'w', 32);
  assert(underdogWin.whiteDiff > 25, 'Underdog should gain large ELO bonus (> 25)');
  assert(underdogWin.blackDiff < -25, 'Higher rated player suffers large ELO drop (< -25)');
}

// Test 9: ChessRoom Engine clock and increment mechanics
{
  const room = new ChessRoom('test_1', 'CODE1', TIME_CONTROLS.blitz_3_2, true, false, () => {});
  room.state.status = 'in_progress';
  assert(room.state.whiteTimeLeft === 180, 'Initial white time is 180s');

  const moveRes = room.makeMove('e4', 'e4'); // Illegal from=e4, to=e4
  assert(!moveRes.success, 'Illegal move correctly rejected by room engine');

  const legalRes = room.makeMove('e2', 'e4');
  assert(legalRes.success, 'Legal move e2-e4 accepted');
  assert(room.state.whiteTimeLeft === 182, 'White time should have 2 second increment added (180 + 2 = 182)');
  assert(room.state.turn === 'b', 'Turn should switch to black');
  assert(room.state.moves.length === 1, 'Move history contains 1 move');
}

console.log('\n🎉 ALL CORE CHESS LOGIC TESTS PASSED PERFECTLY!\n');
