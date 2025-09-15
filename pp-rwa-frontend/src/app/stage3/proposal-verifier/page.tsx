import ProposalVoteVerifier from '@/components/stage3/ProposalVoteVerifier'

export default function ProposalVerifierPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">提案投票验证</h1>
        <p className="text-gray-600 mt-2">
          验证治理合约中提案的实际投票情况
        </p>
      </div>
      
      <ProposalVoteVerifier />
    </div>
  )
}